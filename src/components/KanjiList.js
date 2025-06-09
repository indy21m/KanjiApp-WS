import React from 'react';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const KanjiList = ({ kanjiList }) => {
  const navigate = useNavigate();

  return (
    <Grid container spacing={2}>
      {kanjiList.map((kanji) => (
        <Grid item xs={12} sm={6} md={4} key={kanji.id}>
          <Card
            onClick={() => navigate(`/kanji/${kanji.level}/${encodeURIComponent(kanji.character)}`)}
            sx={{ cursor: 'pointer', transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.05)' }}}
          >
            <CardContent>
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Typography variant="h4" component="div">
                  {kanji.character}
                </Typography>
              </Box>
              <Typography variant="body1" color="text.secondary">
                {kanji.meaning}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {kanji.reading}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default KanjiList;
