import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { KANJI_DATA } from '../data/kanjiData';

const KanjiContext = createContext();

const SRS_STAGE_MAP = {
  0: 'Locked',
  1: 'Apprentice I',
  2: 'Apprentice II',
  3: 'Apprentice III',
  4: 'Apprentice IV',
  5: 'Guru I',
  6: 'Guru II',
  7: 'Master',
  8: 'Enlightened',
  9: 'Burned'
};

const getSrsStageName = (stage) => SRS_STAGE_MAP[stage] || 'Unknown';

export const KanjiProvider = ({ children }) => {
  const [kanjiData, setKanjiData] = useState(() => {
    const savedData = localStorage.getItem('kanjiData');
    try {
      return savedData ? JSON.parse(savedData) : KANJI_DATA;
    } catch (error) {
      console.error("Error parsing kanjiData from localStorage:", error);
      return KANJI_DATA; // Fallback to default data
    }
  });
  const [notifications, setNotifications] = useState([]);
  const [wanikaniApiKey, setWaniKaniApiKey] = useState(() => localStorage.getItem('wanikaniApiKey'));
  const [wanikaniUserData, setWaniKaniUserData] = useState({ level: null, username: null, learnedKanjiCount: null, learnedKanjiChars: [], kanjiDetails: {} });
  const [wanikaniError, setWaniKaniError] = useState(null);

  useEffect(() => {
    // Save data to localStorage whenever it changes
    localStorage.setItem('kanjiData', JSON.stringify(kanjiData));
  }, [kanjiData]);

  useEffect(() => {
    if (wanikaniApiKey) {
      fetchWaniKaniUserData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Fetch on initial load if API key exists

  const updateKanji = useCallback((id, updates) => {
    setKanjiData(prevKanjiData => {
      const updatedData = { ...prevKanjiData };
      const [levelKey] = id.split('_'); // Assuming level is a string key
      const kanjiList = updatedData[levelKey];

      if (kanjiList) {
        const kanjiIndexInList = kanjiList.findIndex(k => k.id === id);
        if (kanjiIndexInList !== -1) {
          const currentKanji = kanjiList[kanjiIndexInList];
          let hasChanged = false;
          const newKanjiData = { ...currentKanji };

          if (updates.mnemonic !== undefined && 
              (updates.mnemonic || '') !== (currentKanji.mnemonic || '')) {
            newKanjiData.mnemonic = updates.mnemonic;
            hasChanged = true;
          }
          if (updates.image !== undefined && 
              (updates.image || null) !== (currentKanji.image || null)) {
            newKanjiData.image = updates.image;
            hasChanged = true;
          }

          if (hasChanged) {
            const newKanjiList = [...kanjiList];
            newKanjiList[kanjiIndexInList] = newKanjiData;
            updatedData[levelKey] = newKanjiList;
            
            setNotifications(prevN => [
              { message: 'Changes saved successfully!', type: 'success', id: Date.now() }, 
              ...prevN.slice(0, 2) // Keep only last 3 notifications
            ]);
            return updatedData;
          }
        }
      }
      return prevKanjiData; // Return previous data if no change or kanji not found
    });
  }, []); // Empty dependency array as setKanjiData and setNotifications are stable

  const saveWaniKaniApiKey = useCallback((key) => {
    localStorage.setItem('wanikaniApiKey', key);
    setWaniKaniApiKey(key);
    setWaniKaniError(null); // Clear previous errors
    // Optionally trigger a fetch immediately after saving a new key
    // fetchWaniKaniUserData(key); // Pass key directly if state update is not immediate
  }, []);

  const fetchWaniKaniUserData = useCallback(async (currentApiKey = wanikaniApiKey) => {
    if (!currentApiKey) {
      setWaniKaniError('API Key not set.');
      setNotifications(prevN => [{ message: 'WaniKani API Key not set.', type: 'error', id: Date.now() }, ...prevN.slice(0, 2)]);
      return;
    }
    setWaniKaniError(null);
    try {
      const response = await fetch('https://api.wanikani.com/v2/user', {
        headers: {
          'Authorization': `Bearer ${currentApiKey}`,
          'Wanikani-Revision': '20170710'
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData?.error || `Error ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }
      const userData = await response.json();
      const userLevel = userData.data.level;
      const userName = userData.data.username;

      // Now fetch learned Kanji count
      const assignmentsResponse = await fetch('https://api.wanikani.com/v2/assignments?subject_types=kanji&passed=true', {
        headers: {
          'Authorization': `Bearer ${currentApiKey}`,
          'Wanikani-Revision': '20170710'
        }
      });
      if (!assignmentsResponse.ok) {
        const errorData = await assignmentsResponse.json();
        throw new Error(errorData?.error || `Error fetching assignments: ${assignmentsResponse.status}`);
      }
      let assignmentsData = await assignmentsResponse.json();
      const learnedKanjiCount = assignmentsData.total_count;
      let allLearnedAssignments = assignmentsData.data; // Contains srs_stage and subject_id
      let nextUrl = assignmentsData.pages.next_url;

      // Paginate through all assignments to get all subject_ids
      while (nextUrl) {
        const nextPageResponse = await fetch(nextUrl, {
          headers: { 'Authorization': `Bearer ${currentApiKey}`, 'Wanikani-Revision': '20170710' }
        });
        if (!nextPageResponse.ok) {
          const errorData = await nextPageResponse.json();
          throw new Error(errorData?.error || `Error fetching next page of assignments: ${nextPageResponse.status}`);
        }
        assignmentsData = await nextPageResponse.json();
        allLearnedAssignments.push(...assignmentsData.data);
        nextUrl = assignmentsData.pages.next_url;
      }

      // Create a map of subject_id to srs_stage from assignments
      const assignmentDetailsMap = allLearnedAssignments.reduce((acc, item) => {
        acc[item.data.subject_id] = {
          srsStage: item.data.srs_stage,
          srsStageName: getSrsStageName(item.data.srs_stage),
          passedAt: item.data.passed_at
        };
        return acc;
      }, {});

      const allLearnedKanjiSubjectIds = allLearnedAssignments.map(item => item.data.subject_id);

      // Fetch subject details (characters) for these IDs in batches
      const learnedKanjiChars = [];
      const newKanjiDetails = {};
      const batchSize = 100; 
      for (let i = 0; i < allLearnedKanjiSubjectIds.length; i += batchSize) {
        const batchIds = allLearnedKanjiSubjectIds.slice(i, i + batchSize);
        if (batchIds.length === 0) continue;
        const subjectsResponse = await fetch(`https://api.wanikani.com/v2/subjects?ids=${batchIds.join(',')}&types=kanji`, {
          headers: { 'Authorization': `Bearer ${currentApiKey}`, 'Wanikani-Revision': '20170710' }
        });
        if (!subjectsResponse.ok) {
          const errorData = await subjectsResponse.json();
          throw new Error(errorData?.error || `Error fetching subjects: ${subjectsResponse.status}`);
        }
        const subjectsData = await subjectsResponse.json();
        subjectsData.data.forEach(subject => {
          const character = subject.data.characters;
          learnedKanjiChars.push(character);
          if (assignmentDetailsMap[subject.id]) {
            newKanjiDetails[character] = {
              subjectId: subject.id,
              srsStage: assignmentDetailsMap[subject.id].srsStage,
              srsStageName: assignmentDetailsMap[subject.id].srsStageName,
              passedAt: assignmentDetailsMap[subject.id].passedAt
              // totalErrors will be N/A for now
            };
          }
        });
      }

      setWaniKaniUserData({ 
        level: userLevel, 
        username: userName, 
        learnedKanjiCount: learnedKanjiCount, 
        learnedKanjiChars: learnedKanjiChars, 
        kanjiDetails: newKanjiDetails 
      });
      setNotifications(prevN => [{ message: `WaniKani: ${userName} (Lvl ${userLevel}), ${learnedKanjiCount} Kanji learned (${learnedKanjiChars.length} chars fetched)!`, type: 'success', id: Date.now() }, ...prevN.slice(0, 2)]);
    } catch (error) {
      console.error('Failed to fetch WaniKani user data:', error);
      setWaniKaniError(error.message);
      setWaniKaniUserData({ level: null, username: null, learnedKanjiCount: null, learnedKanjiChars: [], kanjiDetails: {} }); // Clear data on error
      setNotifications(prevN => [{ message: `WaniKani API Error: ${error.message}`, type: 'error', id: Date.now() }, ...prevN.slice(0, 2)]);
    }
  }, [wanikaniApiKey]);

  const dismissNotification = useCallback((notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  return (
    <KanjiContext.Provider value={{
      kanjiData,
      updateKanji,
      notifications,
      dismissNotification,
      wanikaniApiKey,
      wanikaniUserData,
      wanikaniError,
      saveWaniKaniApiKey,
      fetchWaniKaniUserData
    }}>
      {children}
    </KanjiContext.Provider>
  );
};

export const useKanji = () => {
  const context = useContext(KanjiContext);
  if (!context) {
    throw new Error('useKanji must be used within a KanjiProvider');
  }
  return context;
};
