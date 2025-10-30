// server.js
import express from 'express';
import { AccessToken } from 'livekit-server-sdk';

const createToken = async () => {
  // If this room doesn't exist, it'll be automatically created when the first
  // participant joins
  const roomName = 'quickstart-room';
  // Identifier to be used for participant.
  // It's available as LocalParticipant.identity with livekit-client SDK
  const participantName = 'quickstart-username';

  const at = new AccessToken("APIovoH9gWaMwiE", "uP3yDQ8qaTZmFQKvocieZdwofjf3ubQUoyCXxHf2Gx9C", {
    identity: participantName,
    // Token to expire after 10 minutes
    ttl: '10m',
  });
  at.addGrant({ roomJoin: true, room: roomName });

  return await at.toJwt();
};

const app = express();
const port = 4200;

app.get('/getToken', async (req, res) => {
  res.send(await createToken());
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});