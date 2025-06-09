import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Container, 
  Typography, 
  TextField,
  Button,
  Box,
  IconButton,
  Alert,
  Slide,
  Grid, 
  Paper, 
  Divider,
  Input
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useKanji } from '../context/KanjiContext';

import { ArrowBack, Close as CloseIcon, Edit as EditIcon } from '@mui/icons-material';

const KanjiDetail = () => {
  const { level: levelParam, character: characterParam } = useParams();
  const navigate = useNavigate();
  const { kanjiData, updateKanji, notifications, dismissNotification, wanikaniUserData } = useKanji();

  const decodedCharacter = decodeURIComponent(characterParam);
  const currentKanji = kanjiData[levelParam]?.find(k => k.character === decodedCharacter);
  const internalId = currentKanji?.id;

  const [mnemonic, setMnemonic] = useState('');
  const [image, setImage] = useState('');
  const [isEditingMnemonic, setIsEditingMnemonic] = useState(false);

  useEffect(() => {
    if (currentKanji) {
      // The mnemonic state will hold the user's custom mnemonic, or the WaniKani meaning mnemonic if custom is not set.
      setMnemonic(currentKanji.mnemonic || currentKanji.wanikaniMnemonic || '');
      setImage(currentKanji.image || '');
      setIsEditingMnemonic(false); 
    } else {
      setMnemonic('');
      setImage('');
    }
  }, [currentKanji]);

  useEffect(() => {
    if (internalId && (mnemonic !== currentKanji?.mnemonic || image !== currentKanji?.image)) {
      const timer = setTimeout(() => {
        updateKanji(internalId, { mnemonic, image });
      }, 750); // Debounce auto-save
      return () => clearTimeout(timer);
    }
  }, [internalId, mnemonic, image, currentKanji, updateKanji]);

  if (!currentKanji) {
    return <Typography>Kanji not found.</Typography>;
  }

  return (
    <Container maxWidth="lg"> 
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, mt: 2 }}>
        <IconButton onClick={() => navigate('/')} sx={{ mr: 1 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h3" component="h1" sx={{ flexGrow: 1 }}>
          {currentKanji.character}
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Left Column: Kanji Info & Mnemonic */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h5" gutterBottom><strong>Meaning:</strong> {currentKanji.meaning}</Typography>
            {currentKanji.alternativeMeanings && currentKanji.alternativeMeanings.length > 0 && (
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>Alternative: {currentKanji.alternativeMeanings.join(', ')}</Typography>
            )}

            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>Readings</Typography>
            {currentKanji.onyomi && currentKanji.onyomi.length > 0 && (
              <Typography variant="body1"><strong>On'yomi:</strong> {currentKanji.onyomi.join(', ')}</Typography>
            )}
            {currentKanji.kunyomi && currentKanji.kunyomi.length > 0 && (
              <Typography variant="body1"><strong>Kun'yomi:</strong> {currentKanji.kunyomi.join(', ')}</Typography>
            )}
            {currentKanji.nanori && currentKanji.nanori.length > 0 && (
              <Typography variant="body1"><strong>Nanori:</strong> {currentKanji.nanori.join(', ')}</Typography>
            )}

            <Divider sx={{ my: 3 }} />
            {/* WaniKani Statistics Section */}
            <Typography variant="h6" gutterBottom>WaniKani Statistics</Typography>
            <Box sx={{ mb: 2, p: 1.5, border: '1px solid #eee', borderRadius: 1, backgroundColor: '#f9f9f9' }}>
              <Typography variant="body1">
                <strong>SRS Stage:</strong> {wanikaniUserData?.kanjiDetails?.[decodedCharacter]?.srsStageName || 'N/A'}
              </Typography>
              <Typography variant="body1">
                <strong>Total Errors:</strong> {wanikaniUserData?.kanjiDetails?.[decodedCharacter]?.totalErrors !== undefined ? wanikaniUserData.kanjiDetails[decodedCharacter].totalErrors : 'N/A'}
              </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />
            <Box sx={{ position: 'relative' }}>
              <Typography variant="h6" gutterBottom>Mnemonic</Typography>
              <IconButton 
                aria-label={isEditingMnemonic ? "save mnemonic" : "edit mnemonic"}
                onClick={() => setIsEditingMnemonic(!isEditingMnemonic)}
                size="small"
                sx={{ position: 'absolute', top: 0, right: 0 }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
              {isEditingMnemonic ? (
                <TextField
                  multiline
                  rows={6}
                  fullWidth
                  value={mnemonic}
                  onChange={(e) => setMnemonic(e.target.value)}
                  variant="outlined"
                  sx={{ mb: 1, mt:1 }}
                  autoFocus
                  placeholder="Enter your mnemonic here..."
                />
              ) : (
                <Typography paragraph sx={{ whiteSpace: 'pre-wrap', mt: 1, mb: 1, minHeight: '100px', border: '1px solid #eee', p:1.5, borderRadius:1, backgroundColor: '#f9f9f9' }}>
                  {mnemonic || <i>No mnemonic yet. Click the edit icon to add one.</i>}
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Right Column: Image Upload & Display */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <CustomImageDropzone onImageReady={setImage} currentImage={image} />
          </Paper>
        </Grid>
      </Grid>

      {/* Notifications */}
      {notifications.map((notification) => (
        <Slide key={notification.id} direction="up" in={true} mountOnEnter unmountOnExit>
          <Alert
            severity={notification.type}
            // onClose={() => dismissNotification(notification.id)} // Keep or remove, explicit button is primary
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => {
                  dismissNotification(notification.id);
                }}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
            sx={{ mt: 2, mb: 1, position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 1400, minWidth: '280px' }}
          >
            {notification.message}
          </Alert>
        </Slide>
      ))}
    </Container>
  );
};

const CustomImageDropzone = ({ onImageReady, currentImage }) => {
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = (file) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageReady(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // You can add more visual feedback here if needed
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current.click();
  };

  const dropzoneStyle = {
    width: '100%',
    minHeight: 200,
    border: `2px dashed ${dragging ? 'green' : 'grey'}`, // Highlight when dragging
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: '16px',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease-in-out',
  };

  return (
    <Box
      sx={dropzoneStyle}
      onClick={handleClick}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        style={{ display: 'none' }}
      />
      {currentImage ? (
        <Box sx={{ width: '100%', maxHeight: '300px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <img src={currentImage} alt="Preview" style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: '4px' }} />
        </Box>
      ) : (
        <Typography sx={{ color: 'text.secondary', textAlign: 'center' }}>
          Drag 'n' drop an image here, or click to select
        </Typography>
      )}
    </Box>
  );
};

export default KanjiDetail;
