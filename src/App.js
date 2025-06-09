import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Container, AppBar, Toolbar, Typography, Box, Button, ToggleButtonGroup, ToggleButton } from '@mui/material';
import KanjiList from './components/KanjiList';
import KanjiDetail from './pages/KanjiDetail';
import Settings from './pages/Settings'; // Import the new Settings page
import { KanjiProvider, useKanji } from './context/KanjiContext';
import { Link as RouterLink } from 'react-router-dom'; // For navigation button

function KanjiAppRoutes() {
  const { kanjiData, wanikaniApiKey, wanikaniUserData } = useKanji();
  const [filterMode, setFilterMode] = useState('all'); // 'all' or 'learned'
  const getKanjiByLevel = (level) => {
    const levelKanjis = kanjiData[level] || [];
    if (filterMode === 'learned' && wanikaniUserData && wanikaniUserData.learnedKanjiChars && wanikaniUserData.learnedKanjiChars.length > 0) {
      return levelKanjis.filter(kanji => wanikaniUserData.learnedKanjiChars.includes(kanji.character));
    }
    return levelKanjis;
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Japanese Kanji Learning App
          </Typography>
          <Button color="inherit" component={RouterLink} to="/">Home</Button>
          <Button color="inherit" component={RouterLink} to="/settings">Settings</Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Routes>
          <Route path="/" element={
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h3" component="h1" gutterBottom sx={{ textAlign: 'center' }}>
                  Kanji by Level {filterMode === 'learned' ? '(Learned on WaniKani)' : '(All)'}
                </Typography>
                {wanikaniApiKey && wanikaniUserData && wanikaniUserData.learnedKanjiChars && wanikaniUserData.learnedKanjiChars.length > 0 && (
                  <ToggleButtonGroup
                    color="primary"
                    value={filterMode}
                    exclusive
                    onChange={(event, newFilterMode) => {
                      if (newFilterMode !== null) {
                        setFilterMode(newFilterMode);
                      }
                    }}
                    aria-label="Kanji filter"
                  >
                    <ToggleButton value="all">All Kanji</ToggleButton>
                    <ToggleButton value="learned">My Learned Kanji</ToggleButton>
                  </ToggleButtonGroup>
                )}
              </Box>
              {Object.entries(kanjiData)
                .sort(([levelA], [levelB]) => parseInt(levelA) - parseInt(levelB))
                .map(([level]) => {
                  const filteredKanjisInLevel = getKanjiByLevel(level);
                  // Conditionally render the level section only if there are kanjis to show after filtering
                  if (filterMode === 'learned' && filteredKanjisInLevel.length === 0) {
                    // Optionally, render a message or return null to hide the level section
                    // For example: return <Typography key={`level-empty-${level}`} sx={{ mb:1 }}>No learned Kanji for Level {level}.</Typography>;
                    return null;
                  }
                  return (
                    <Box key={level} sx={{ mb: 5 }}>
                      <Typography variant="h4" component="h2" gutterBottom sx={{ borderBottom: '1px solid #e0e0e0', pb: 1, mb: 3 }}>
                        Level {level}
                      </Typography>
                      {filteredKanjisInLevel.length > 0 ? (
                        <KanjiList kanjiList={filteredKanjisInLevel} />
                      ) : (
                        <Typography>
                          No Kanji available for this level{filterMode === 'learned' ? ' (matching your WaniKani learned items)' : ''}.
                        </Typography>
                      )}
                    </Box>
                  );
                })}
            </Box>
          } />
          <Route path="/settings" element={<Settings />} />
          <Route path="/level/:level" element={
            <Box>
              <Typography variant="h4" gutterBottom>
                Level {window.location.pathname.split('/')[2]}
              </Typography>
              <KanjiList kanjiList={getKanjiByLevel(window.location.pathname.split('/')[2])} />
            </Box>
          } />
          <Route path="/kanji/:level/:character" element={<KanjiDetail />} />
        </Routes>
      </Container>
    </Box>
  );
}

function App() {
  return (
    <Router>
      <KanjiProvider>
        <KanjiAppRoutes />
      </KanjiProvider>
    </Router>
  );
}

export default App;
