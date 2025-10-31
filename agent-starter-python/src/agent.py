import logging
import sys
import os
import httpx

from dotenv import load_dotenv
from livekit.agents import (
    Agent,
    AgentSession,
    JobContext,
    JobProcess,
    MetricsCollectedEvent,
    RoomInputOptions,
    WorkerOptions,
    cli,
    inference,
    metrics,
    function_tool,
    RunContext,
)
from livekit.plugins import noise_cancellation, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel

# Add parent directory to path to import business_config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from business_config import get_business_info_text

logger = logging.getLogger("agent")

load_dotenv(".env.local")


class CustomerSupportAgent(Agent):
    def __init__(self) -> None:
        # Get business information from configuration
        business_info = get_business_info_text()
        
        instructions = f"""You are a professional customer support executive for our company. You are speaking with customers via voice, so keep your responses conversational and natural.

IMPORTANT: You can ONLY answer questions based on the specific business information provided below. 

ESCALATION POLICY:
When you cannot answer a customer's question because it's not covered in the business information:
1. Acknowledge that you don't have that information available
2. Ask the customer: "Would you like me to raise a complaint or service request for this issue? Our team will review it and get back to you."
3. If the customer agrees (says yes, sure, ok, please do, etc.), you MUST use the create_service_request tool to create a brief summary of the issue
4. After creating the request, confirm with the customer: "I've successfully created a service request for your issue. Our team will review it and respond to you shortly. Is there anything else I can help you with?"

{business_info}

COMMUNICATION STYLE:
- Be professional, friendly, and helpful
- Keep responses concise and clear
- Use a warm, welcoming tone
- Ask clarifying questions when needed
- If you don't know something, admit it and offer to create a service request
- Always end conversations by asking if there's anything else you can help with

Remember: Only provide information that's explicitly mentioned above. For anything else, offer to create a service request."""

        super().__init__(instructions=instructions)

    @function_tool
    async def create_service_request(self, context: RunContext, question_summary: str):
        """Create a service request or complaint for an issue that cannot be resolved by the agent.
        
        Use this tool when a customer asks about something not covered in the business information
        and they have agreed to raise a complaint or service request. Create a brief, clear summary
        of the customer's issue or question.
        
        Args:
            question_summary: A brief summary of the customer's question or issue that needs human intervention
        """
        backend_url = os.getenv("BACKEND_URL", "http://localhost:4200")
        
        try:
            logger.info(f"Creating service request for: {question_summary}")
            logger.info(f"Calling backend at: {backend_url}/api/escalation-requests")
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{backend_url}/api/escalation-requests",
                    json={"question": question_summary},
                    headers={"Content-Type": "application/json"},
                )
                
                logger.info(f"Backend response status: {response.status_code}")
                
                if response.status_code == 201:
                    result = response.json()
                    request_id = result.get("data", {}).get("id", "unknown")
                    logger.info(f"Service request created successfully with ID: {request_id}")
                    return f"Service request created successfully. Request ID: {request_id}. Our team will review your issue and respond to you shortly."
                else:
                    error_msg = response.text
                    logger.error(f"Failed to create service request: {error_msg}")
                    return f"I apologize, but I encountered an error while creating your service request. Please try again or contact our support team directly."
        
        except httpx.TimeoutException:
            logger.error("Timeout while creating service request")
            return "I apologize, but the service request system is temporarily unavailable. Please try again in a moment or contact our support team directly."
        except Exception as e:
            logger.error(f"Error creating service request: {str(e)}")
            return f"I apologize, but I encountered an error while creating your service request: {str(e)}. Please contact our support team directly."


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


async def entrypoint(ctx: JobContext):
    # Logging setup
    # Add any other context you want in all log entries here
    ctx.log_context_fields = {
        "room": ctx.room.name,
    }

    # Set up a voice AI pipeline using OpenAI, Cartesia, AssemblyAI, and the LiveKit turn detector
    session = AgentSession(
        # Speech-to-text (STT) is your agent's ears, turning the user's speech into text that the LLM can understand
        # See all available models at https://docs.livekit.io/agents/models/stt/
        stt=inference.STT(model="assemblyai/universal-streaming", language="en"),
        # A Large Language Model (LLM) is your agent's brain, processing user input and generating a response
        # See all available models at https://docs.livekit.io/agents/models/llm/
        llm=inference.LLM(model="openai/gpt-4.1-mini"),
        # Text-to-speech (TTS) is your agent's voice, turning the LLM's text into speech that the user can hear
        # See all available models as well as voice selections at https://docs.livekit.io/agents/models/tts/
        tts=inference.TTS(
            model="cartesia/sonic-3", voice="9626c31c-bec5-4cca-baa8-f8ba9e84c8bc"
        ),
        # VAD and turn detection are used to determine when the user is speaking and when the agent should respond
        # See more at https://docs.livekit.io/agents/build/turns
        turn_detection=MultilingualModel(),
        vad=ctx.proc.userdata["vad"],
        # allow the LLM to generate a response while waiting for the end of turn
        # See more at https://docs.livekit.io/agents/build/audio/#preemptive-generation
        preemptive_generation=True,
    )

    # To use a realtime model instead of a voice pipeline, use the following session setup instead.
    # (Note: This is for the OpenAI Realtime API. For other providers, see https://docs.livekit.io/agents/models/realtime/))
    # 1. Install livekit-agents[openai]
    # 2. Set OPENAI_API_KEY in .env.local
    # 3. Add `from livekit.plugins import openai` to the top of this file
    # 4. Use the following session setup instead of the version above
    # session = AgentSession(
    #     llm=openai.realtime.RealtimeModel(voice="marin")
    # )

    # Metrics collection, to measure pipeline performance
    # For more information, see https://docs.livekit.io/agents/build/metrics/
    usage_collector = metrics.UsageCollector()

    @session.on("metrics_collected")
    def _on_metrics_collected(ev: MetricsCollectedEvent):
        metrics.log_metrics(ev.metrics)
        usage_collector.collect(ev.metrics)

    async def log_usage():
        summary = usage_collector.get_summary()
        logger.info(f"Usage: {summary}")

    ctx.add_shutdown_callback(log_usage)

    # # Add a virtual avatar to the session, if desired
    # # For other providers, see https://docs.livekit.io/agents/models/avatar/
    # avatar = hedra.AvatarSession(
    #   avatar_id="...",  # See https://docs.livekit.io/agents/models/avatar/plugins/hedra
    # )
    # # Start the avatar and wait for it to join
    # await avatar.start(session, room=ctx.room)

    # Start the session, which initializes the voice pipeline and warms up the models
    await session.start(
        agent=CustomerSupportAgent(),
        room=ctx.room,
        room_input_options=RoomInputOptions(
            # For telephony applications, use `BVCTelephony` for best results
            noise_cancellation=noise_cancellation.BVC(),
        ),
    )

    # Join the room and connect to the user
    await ctx.connect()


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, prewarm_fnc=prewarm))
