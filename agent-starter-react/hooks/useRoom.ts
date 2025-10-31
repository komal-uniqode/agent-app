import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Room, RoomEvent, TokenSource } from 'livekit-client';
import { AppConfig } from '@/app-config';
import { toastAlert } from '@/components/livekit/alert-toast';

export function useRoom(appConfig: AppConfig) {
  const aborted = useRef(false);
  const room = useMemo(() => new Room(), []);
  const [isSessionActive, setIsSessionActive] = useState(false);

  useEffect(() => {
    function onDisconnected() {
      setIsSessionActive(false);
    }

    function onMediaDevicesError(error: Error) {
      toastAlert({
        title: 'Encountered an error with your media devices',
        description: `${error.name}: ${error.message}`,
      });
    }

    room.on(RoomEvent.Disconnected, onDisconnected);
    room.on(RoomEvent.MediaDevicesError, onMediaDevicesError);

    return () => {
      room.off(RoomEvent.Disconnected, onDisconnected);
      room.off(RoomEvent.MediaDevicesError, onMediaDevicesError);
    };
  }, [room]);

  useEffect(() => {
    return () => {
      aborted.current = true;
      room.disconnect();
    };
  }, [room]);

  const tokenSource = useMemo(
    () =>
      TokenSource.custom(async () => {
        const url = new URL(
          process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ?? '/api/connection-details',
          window.location.origin
        );

        try {
          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
          
          const tokenRes = await fetch(`${backendUrl}/getToken`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!tokenRes.ok) {
            throw new Error(`Failed to fetch token from backend: ${tokenRes.status}`);
          }

          const tokenData = await tokenRes.json();

          // Return connection details in the same format as the original Next.js API
          const finalConnectionDetails = {
            serverUrl: process.env.NEXT_PUBLIC_LIVEKIT_URL,
            roomName: tokenData.roomName || 'quickstart-room',
            participantName: tokenData.participantName || 'quickstart-username',
            participantToken: tokenData.token,
          };
          
          return finalConnectionDetails;
        } catch (error) {
          console.error('Error fetching token:', error);
          throw new Error(`Error fetching connection details or token: ${error.message}`);
        }
      }),
    [appConfig]
  );

  const startSession = useCallback(() => {
    setIsSessionActive(true);

    if (room.state === 'disconnected') {
      const { isPreConnectBufferEnabled } = appConfig;
      Promise.all([
        room.localParticipant.setMicrophoneEnabled(true, undefined, {
          preConnectBuffer: isPreConnectBufferEnabled,
        }),
        tokenSource
          .fetch({ agentName: appConfig.agentName })
          .then((connectionDetails) =>
            room.connect(connectionDetails.serverUrl, connectionDetails.participantToken)
          ),
      ]).catch((error) => {
        if (aborted.current) {
          // Once the effect has cleaned up after itself, drop any errors
          //
          // These errors are likely caused by this effect rerunning rapidly,
          // resulting in a previous run `disconnect` running in parallel with
          // a current run `connect`
          return;
        }

        toastAlert({
          title: 'There was an error connecting to the agent',
          description: `${error.name}: ${error.message}`,
        });
      });
    }
  }, [room, appConfig, tokenSource]);

  const endSession = useCallback(() => {
    setIsSessionActive(false);
  }, []);

  return { room, isSessionActive, startSession, endSession };
}
