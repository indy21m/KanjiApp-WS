import React, { useState, useEffect } from 'react';
import { useKanji } from '../context/KanjiContext';
import { Container, Typography, TextField, Button, Box, Paper, Alert } from '@mui/material';

const Settings = () => {
  const {
    wanikaniApiKey,
    wanikaniUserData,
    wanikaniError,
    saveWaniKaniApiKey,
    fetchWaniKaniUserData
  } = useKanji();

  const [localApiKey, setLocalApiKey] = useState('');

  useEffect(() => {
    if (wanikaniApiKey) {
      setLocalApiKey(wanikaniApiKey);
    }
  }, [wanikaniApiKey]);

  const handleSaveApiKey = async () => {
    if (localApiKey.trim() === '') {
      alert('Please enter an API key.');
      return;
    }
    saveWaniKaniApiKey(localApiKey);
    // Fetching is now also triggered by useEffect in KanjiContext when apiKey changes,
    // but calling it here ensures immediate feedback after save.
    await fetchWaniKaniUserData(localApiKey); // Pass localApiKey to use the latest value immediately
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom sx={{ mt: 3, mb: 3 }}>
        WaniKani Integration Settings
      </Typography>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Connect to WaniKani
        </Typography>
        <Typography paragraph color="text.secondary">
          Enter your WaniKani API v2 Personal Access Token to sync your learning progress.
          This key will be stored locally in your browser.
        </Typography>
        <TextField
          fullWidth
          label="WaniKani API v2 Key"
          variant="outlined"
          value={localApiKey}
          onChange={(e) => setLocalApiKey(e.target.value)}
          sx={{ mb: 2 }}
          type="password" // Hide the key by default
        />
        <Box sx={{ display: 'flex', gap: 1, mb: 3}}>
          <Button variant="contained" color="primary" onClick={handleSaveApiKey}>
            Save API Key
          </Button>
          <Button variant="outlined" onClick={() => fetchWaniKaniUserData()}>
            Refresh WaniKani Data
          </Button>
        </Box>

        {wanikaniError && (
          <Alert severity="error" sx={{ mb: 2 }}>{wanikaniError}</Alert>
        )}
        {wanikaniUserData && wanikaniUserData.username && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6">Your WaniKani Profile:</Typography>
            <Typography>Username: {wanikaniUserData.username}</Typography>
            <Typography>Current Level: {wanikaniUserData.level}</Typography>
            {wanikaniUserData.learnedKanjiCount !== null && (
              <Typography>Learned Kanji (WaniKani): {wanikaniUserData.learnedKanjiCount}</Typography>
            )}
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default Settings;
