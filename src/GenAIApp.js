import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import * as speechsdk from 'microsoft-cognitiveservices-speech-sdk';
import { FaPlay, FaReadme, FaArrowLeft, FaSignOutAlt, FaSpinner, FaCloudDownloadAlt, FaEdit, FaMarkdown, FaEnvelopeOpenText, FaHeadphones, FaYoutube, FaPrint } from 'react-icons/fa';
import './GenAIApp.css';
import { collection, doc, where, addDoc, getDocs, query, orderBy, startAfter, limit, updateDoc } from 'firebase/firestore';
import {
    onAuthStateChanged,
    signOut,
} from 'firebase/auth';
import App from './App';
import { auth, db } from './Firebase';
import VoiceSelect from './VoiceSelect';
import { TbEmpathize } from "react-icons/tb";
import { MdSettingsInputComponent } from "react-icons/md";
import { FaK } from "react-icons/fa6";
import MarkdownIt from 'markdown-it';
import MdEditor from 'react-markdown-editor-lite';
// import style manually
import 'react-markdown-editor-lite/lib/index.css';
import speakerIcon from './speak.png';
import imageIcon from './image.png';
import youtubeIcon from './youtube.png';

const speechKey = process.env.REACT_APP_AZURE_SPEECH_API_KEY;
const serviceRegion = 'eastus';
const isiPhone = /iPhone/i.test(navigator.userAgent);
console.log(isiPhone);

let searchQuery = '';
let searchModel = 'All';
let dataLimit = 11;
let promptSuggestion = 'NA';
let autoPromptInput = '';
let youtubePromptInput = '';
let googleSearchPromptInput = '';
let youtubeSelected = false;
let youtubeTitlePrompt = 'Generate a catchy, clickable and search engine optimized YouTube title, description for the content below  ::::  ';
let imagesSearchPrompt = 'For the following content, I would like to search for images for my reserach project. Please divide following content in 5-10 logical and relevant image descriptions that I can use to search in google images.::: For each image description, include clickable url to search google images ::::: below is the full content ::::: ';
let fullPromptInput = '';
let autoPromptSeparator = '### all the text from below is strictly for reference and prompt purpose to answer the question asked above this line. ######### '
let questionTrimLength = 200;
let appendPrompt = ' ';
let imagePromptInput = '';
let imageSelected = false;
let homeWorkInput = '';
let chunk_size = 4000;
let silence_break = 900;


const GenAIApp = () => {
    // **State Variables**
    const [genaiData, setGenaiData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [lastVisible, setLastVisible] = useState(null); // State for the last visible document
    const [language, setLanguage] = useState("en");
    // Authentication state
    const [user, setUser] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [uid, setUid] = useState(null);
    const [promptInput, setPromptInput] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGeneratingGemini, setIsGeneratingGemini] = useState(false);
    const [isGeneratingAnthropic, setIsGeneratingAnthropic] = useState(false);
    const [isGeneratingoMini, setIsGeneratingoMini] = useState(false);
    const [isGeneratingImage_Dall_e_3, setIsGeneratingImage_Dall_e_3] = useState(false);
    const [isClaudeThink, setIsClaudeThink] = useState(true);
    const [isGeneratingClaudeThink, setIsGeneratingClaudeThink] = useState(false);
    const [isOpenAI, setIsOpenAI] = useState(false);
    const [isAnthropic, setIsAnthropic] = useState(true);
    const [isGemini, setIsGemini] = useState(true);
    const [isoMini, setIsoMini] = useState(true);
    const [isLlama, setIsLlama] = useState(false);
    const [isMistral, setIsMistral] = useState(false);
    const [isGpt4Turbo, setIsGpt4Turbo] = useState(false);
    const [isGeminiSearch, setIsGeminiSearch] = useState(true);
    const [isGeminiFlash, setIsGeminiFlash] = useState(false);
    const [isGeminiThink, setIsGeminiThink] = useState(true);
    const [isPerplexity, setIsPerplexity] = useState(false);
    const [isCodestral, setIsCodestral] = useState(false);
    const [isGeneratingGeminiSearch, setIsGeneratingGeminiSearch] = useState(false);
    const [isGeneratingGeminiFlash, setIsGeneratingGeminiFlash] = useState(false);
    const [isGeneratingGeminiThink, setIsGeneratingGeminiThink] = useState(false);
    const [isImage_Dall_e_3, setIsImage_Dall_e_3] = useState(false);
    const [isTTS, setIsTTS] = useState(false);
    const [isGeneratingTTS, setIsGeneratingTTS] = useState(false);
    const [iso, setIso] = useState(false); // New state for o
    const [isGeneratingo, setIsGeneratingo] = useState(false);
    const [isGeneratingLlama, setIsGeneratingLlama] = useState(false);
    const [isGeneratingGpt4Turbo, setIsGeneratingGpt4Turbo] = useState(false);
    const [isGeneratingPerplexity, setIsGeneratingPerplexity] = useState(false);
    const [isGeneratingCodeStral, setIsGeneratingCodeStral] = useState(false);
    const [isGeneratingMistral, setIsGeneratingMistral] = useState(false);
    const [voiceName, setVoiceName] = useState('en-US-LunaNeural');
    const [genaiPrompts, setGenaiPrompts] = useState([]);
    const [showEditPopup, setShowEditPopup] = useState(false);
    const [editPromptTag, setEditPromptTag] = useState('');
    const [editPromptFullText, setEditPromptFullText] = useState('');
    const [generatedResponse, setGeneratedResponse] = useState(null);
    const [selectedPrompt, setSelectedPrompt] = useState(null);
    const [selectedPromptFullText, setSelectedPromptFullText] = useState(null);
    const [showMainApp, setShowMainApp] = useState(false);
    const [GenAIParameter, setGenAIParameter] = useState(false);
    const [temperature, setTemperature] = useState(6);
    const [top_p, setTop_p] = useState(0.7);
    const [autoPromptLimit, setAutoPromptLimit] = useState(1);
    const [showTemp, setShowTemp] = useState(false);
    const [showTop_p, setShowTop_p] = useState(false);
    const [showGpt4Turbo, setShowGpt4Turbo] = useState(false);
    const [showMistral, setShowMistral] = useState(false);
    const [showLlama, setShowLlama] = useState(false);
    const [showClaudeThink, setShowClaudeThink] = useState(true);
    const [showGeminiSearch, setShowGeminiSearch] = useState(true);
    const [showGeminiFlash, setShowGeminiFlash] = useState(false);
    const [showGeminiThink, setShowGeminiThink] = useState(true);
    const [showPerplexity, setShowPerplexity] = useState(false);
    const [showCodeStral, setShowCodeStral] = useState(true);
    const [showGemini, setShowGemini] = useState(true);
    const [showAnthropic, setShowAnthropic] = useState(true);
    const [showOpenAI, setShowOpenAI] = useState(true);
    const [showo, setShowo] = useState(true);
    const [showImageDallE3, setShowImageDallE3] = useState(false);
    const [showTTS, setShowTTS] = useState(false);
    const [showoMini, setShowoMini] = useState(true);
    const [showAutoPrompt, setShowAutoPrompt] = useState(false);
    const [showPrompt, setShowPrompt] = useState(false);    
    const [modelAnthropic, setModelAnthropic] = useState('claude');
    const [modelGemini, setModelGemini] = useState('gemini');
    const [modelOpenAI, setModelOpenAI] = useState('gpt');
    const [modeloMini, setModeloMini] = useState('o-mini-think');
    const [modelo, setModelo] = useState('o-think');
    const [modelLlama, setModelLlama] = useState('llama');
    const [modelMistral, setModelMistral] = useState('mistral');
    const [modelClaudeThink, setModelClaudeThink] = useState('claude-think');
    const [modelGeminiSearch, setModelGeminiSearch] = useState('gemini-search');
    const [modelGeminiFlash, setModelGeminiFlash] = useState('gemini-flash');
    const [modelGpt4Turbo, setModelGpt4Turbo] = useState('gpt-turbo');
    const [modelImageDallE3, setModelImageDallE3] = useState('dall-e-3');
    const [modelGeminiThink, setModelGeminiThink] = useState('gemini-think');
    const [modelPerplexity, setModelPerplexity] = useState('perplexity');
    const [modelCodestralApi, setModelCodestralApi] = useState('mistral-codestral-api'); // New state
    const [autoPrompt, setAutoPrompt] = useState(true);
    const [showSaveButton, setShowSaveButton] = useState(false);
    const [showSourceDocument, setShowSourceDocument] = useState(false);
    const [showYouTubeButton, setShowYouTubeButton] = useState(false);
    const [showVoiceSelect, setShowVoiceSelect] = useState(false);
    const mdParser = new MarkdownIt(/* Markdown-it options */);

    // Add new state variables for Claude-Haiku
    const [isClaudeHaiku, setIsClaudeHaiku] = useState(false);
    const [isGeneratingClaudeHaiku, setIsGeneratingClaudeHaiku] = useState(false);
    const [modelClaudeHaiku, setModelClaudeHaiku] = useState('Claude-Haiku');

    // Add showClaudeHaiku state variable
    const [showClaudeHaiku, setShowClaudeHaiku] = useState(false); // Set to true or false as needed

    // Add new state variables for Sambanova
    const [isSambanova, setIsSambanova] = useState(false);
    const [isGeneratingSambanova, setIsGeneratingSambanova] = useState(false);
    const [showSambanova, setShowSambanova] = useState(false);
    const [modelSambanova, setModelSambanova] = useState('sambanova');

    // Add new state variables near other model state variables
    const [isGroq, setIsGroq] = useState(false);
    const [isGeneratingGroq, setIsGeneratingGroq] = useState(false);
    const [showGroq, setShowGroq] = useState(false);
    const [modelGroq, setModelGroq] = useState('groq');
    const [labelGroq, setLabelGroq] = useState('Llama');

    // Add new state variables for nova after other model state variables
    const [isNova, setIsNova] = useState(false);
    const [isGeneratingNova, setIsGeneratingNova] = useState(false);
    const [showNova, setShowNova] = useState(false);
    const [modelNova, setModelNova] = useState('nova');

    // Add these state variables after other model state variables
   /* const [labelOpenAI, setLabelOpenAI] = useState('ChatGPT');
    const [labelAnthropic, setLabelAnthropic] = useState('Claude');
    const [labelGemini, setLabelGemini] = useState('Gemini');
    const [labeloMini, setLabeloMini] = useState('o-mini');
    const [labelMistral, setLabelMistral] = useState('Mistral');
    const [labelLlama, setLabelLlama] = useState('Llama(405B)');
    const [labelGpt4Turbo, setLabelGpt4Turbo] = useState('Gpt4Turbo');
    const [labelGeminiSearch, setLabelGeminiSearch] = useState('SearchGenAI');
    const [labelGeminiFlash, setLabelGeminiFlash] = useState('Gemini Flash');
    const [labelClaudeThink, setLabelClaudeThink] = useState('ClaudeThink');
    const [labelo, setLabelo] = useState('o1 Think');
    const [labelGeminiThink, setLabelGeminiThink] = useState('Gemini Think');
    const [labelPerplexity, setLabelPerplexity] = useState('Plxty');
    const [labelCodestral, setLabelCodestral] = useState('CodeStral');
    const [labelClaudeHaiku, setLabelClaudeHaiku] = useState('Claude-Haiku');
    const [labelSambanova, setLabelSambanova] = useState('Llama(S)');
    const [labelNova, setLabelNova] = useState('Nova');*/
    const [labelOpenAI, setLabelOpenAI] = useState('Chaarvi');
    const [labelAnthropic, setLabelAnthropic] = useState('Rudra');
    const [labelGemini, setLabelGemini] = useState('Siya');
    const [labeloMini, setLabeloMini] = useState('Krishna');
    const [labelMistral, setLabelMistral] = useState('Mistral');
    const [labelLlama, setLabelLlama] = useState('Llama(405B)');
    const [labelGpt4Turbo, setLabelGpt4Turbo] = useState('Gpt4Turbo');
    const [labelGeminiSearch, setLabelGeminiSearch] = useState('Karan');
    const [labelGeminiFlash, setLabelGeminiFlash] = useState('Gemini Flash');
    const [labelClaudeThink, setLabelClaudeThink] = useState('Arjun');
    const [labelo, setLabelo] = useState('Medha');
    const [labelGeminiThink, setLabelGeminiThink] = useState('Virat');
    const [labelPerplexity, setLabelPerplexity] = useState('Plxty');
    const [labelCodestral, setLabelCodestral] = useState('Aarush');
    const [labelClaudeHaiku, setLabelClaudeHaiku] = useState('Claude-Haiku');
    const [labelSambanova, setLabelSambanova] = useState('Llama(S)');
    const [labelNova, setLabelNova] = useState('Nova');
    const [isYouTubeTitle, setIsYouTubeTitle] = useState(false);
    const [isImagesSearch, setIsImagesSearch] = useState(false);
    const [showImagesSearchWordsButton, setShowImagesSearchWordsButton] = useState(false);
    const [showYouTubeTitleDescriptionButton, setShowYouTubeTitleDescriptionButton] = useState(false);
    const [isHomeWork, setIsHomeWork] = useState(false);
    const [showHomeWorkButton, setShowHomeWorkButton] = useState(false);

    // Add state variable for AI Search
    const [isAISearch, setIsAISearch] = useState(false);
    const [showAISearchButton, setShowAISearchButton] = useState(false); // or set based on configuration
    // Add these state variables near other state declarations
    const [isLiveAudioPlaying, setIsLiveAudioPlaying] = useState({});
    const [isGeneratingDownloadableAudio, setIsGeneratingDownloadableAudio] = useState({});
    // Add new state variable for YouTube audio title button
    const [isGeneratingYouTubeAudioTitle, setIsGeneratingYouTubeAudioTitle] = useState({});

    // Add new model "Cerebras" state variables
    const [isCerebras, setIsCerebras] = useState(false);
    const [isGeneratingCerebras, setIsGeneratingCerebras] = useState(false);
    const [showCerebras, setShowCerebras] = useState(false);
    const [modelCerebras, setModelCerebras] = useState('llama-c');
    const [labelCerebras, setLabelCerebras] = useState('Llama-C');

    // Add new model "DeepSeek" state variables
    const [isDeepSeek, setIsDeepSeek] = useState(false);
    const [isGeneratingDeepSeek, setIsGeneratingDeepSeek] = useState(false);
    const [showDeepSeek, setShowDeepSeek] = useState(true);
    const [modelDeepSeek, setModelDeepSeek] = useState('DeepSeek');
    const [labelDeepSeek, setLabelDeepSeek] = useState('Devansh');


    const embedPrompt = async (docId) => {
        try {
            console.log('Embedding prompt:', docId);
            const response = await fetch(`${process.env.REACT_APP_GENAI_API_URL}embed-prompt`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ doc_id: docId, uid: uid })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to embed prompt.');
            }
            const data = await response.json();
            console.log('Embed Prompt Response:', data);
        } catch (error) {
            console.error('Error embedding prompt:', error);
            alert(`Error: ${error.message}`);
        }
    };
    // Helper function to save prompt
    const handleSavePrompt = async () => {
        if (!editPromptTag.trim() || !editPromptFullText.trim()) {
            alert('Please enter a prompt.');
            return;
        }
        try {
            const user = auth.currentUser;
            let docId = '';
            const currentDateTime = new Date();
            const promptSize = editPromptFullText.length; // Calculate the size of the prompt

            if (!user) {
                console.error("No user is signed in");
                return;
            }
            const genaiCollection = collection(db, 'genai', user.uid, 'prompts');
            if (selectedPrompt === 'NA' || selectedPrompt == null) {
                console.log('Adding new prompt');
                const newDocRef = await addDoc(genaiCollection, {
                    tag: editPromptTag,
                    fullText: editPromptFullText,
                    createdDateTime: currentDateTime,
                    modifiedDateTime: currentDateTime,
                    size: promptSize
                });
                docId = newDocRef.id;
            } else {
                console.log('Updating prompt');
                const q = query(genaiCollection, where('tag', '==', selectedPrompt), limit(1));
                const genaiSnapshot = await getDocs(q);
                const genaiList = genaiSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                const docRef = doc(db, 'genai', user.uid, 'prompts', genaiList[0].id);
                await updateDoc(docRef, {
                    tag: editPromptTag,
                    fullText: editPromptFullText,
                    modifiedDateTime: currentDateTime,
                    size: promptSize
                });
                docId = docRef.id;
                await fetchPrompts(user.uid);
            }
            embedPrompt(docId);
            setEditPromptTag('');
            setEditPromptFullText('');
            setShowEditPopup(false);
            return;

        } catch (error) {
            console.error("Error saving prompt: ", error);
        }
    };

    // Helper function to get URL parameters
    const getUrlParameter = (name) => {
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        return urlParams.get(name);
    };

    const questionLimit = getUrlParameter('question_limit');
    const telugu = getUrlParameter('telugu');
    const hindi = getUrlParameter('hindi');

    // Helper function to truncate questions based on limit
    const getQuestionSubstring = (question) => {
        const marker = '###';
        const markerIndex = question.indexOf(marker);
        if (markerIndex !== -1) {
            return question.substring(0, Math.min(markerIndex, questionTrimLength));
        }
        else {
            return question.substring(0, questionTrimLength);
        }
    };

    // Listen for authentication state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                const urlParams = new URLSearchParams(window.location.search);
                const genaiAdmin = urlParams.get('admin');
                const genaiParam = urlParams.get('genai');
                if (genaiParam) {
                    setGenAIParameter(true);
                }
                if (genaiAdmin === '46734') {
                    setShowPrompt(true);
                }
                if (process.env.REACT_APP_MAIN_APP === 'GenAI') {
                    setGenAIParameter(true);
                }
                setUid(currentUser.uid);
                setEmail(currentUser.email);
                console.log('User is signed in:', currentUser.uid);
                // Fetch data for the authenticated user
                fetchData(currentUser.uid);
                fetchPrompts(currentUser.uid);
                await fetchGenAIParameters(currentUser.uid);
            }
            else {
                console.log('No user is signed in');
            }
        });
        return () => unsubscribe();
    }, [showEditPopup]);

    const fetchGenAIParameters = async (firebaseUserID) => {
        try {
            console.log('Fetching genai parameters...');
            const configurationCollection = collection(db, 'genai', firebaseUserID, 'configuration');
            const q = query(configurationCollection, where('setup', '==', 'genai'));
            const voiceNamesSnapshot = await getDocs(q);
            voiceNamesSnapshot.forEach(doc => {
                const data = doc.data();
                console.log('Data:', data.temperature, data.top_p);
                if (data.temperature !== undefined) setTemperature(data.temperature);
                if (data.top_p !== undefined) setTop_p(data.top_p);
                if (data.autoPrompt !== undefined) setAutoPrompt(data.autoPrompt);
                if (data.autoPromptLimit !== undefined) setAutoPromptLimit(data.autoPromptLimit);
                if (data.dataLimit !== undefined) dataLimit = data.dataLimit;
                if (data.showImagesSearchWordsButton !== undefined) setShowImagesSearchWordsButton(data.showImagesSearchWordsButton);
                if (data.voiceName !== undefined) setVoiceName(data.voiceName);
                if (data.chunk_size !== undefined) {
                    chunk_size = data.chunk_size;
                }
                if (data.silence_break !== undefined) {
                    silence_break = data.silence_break;
                }
                if (data.isCerebras !== undefined) { setIsCerebras(data.isCerebras); }
                if (data.labelCerebras !== undefined) { setLabelCerebras(data.labelCerebras); }
                if (data.isDeepSeek !== undefined) { setIsDeepSeek(data.isDeepSeek); }
                if (data.labelDeepSeek !== undefined) { setLabelDeepSeek(data.labelDeepSeek); }
                if (data.isAISearch !== undefined) { setIsAISearch(data.isAISearch); }
                if (data.showVoiceSelect !== undefined) { setShowVoiceSelect(data.showVoiceSelect);}
            });
        } catch (error) {
            console.error("Error fetching genAI parameters: ", error);
            return [];
        }
    };
    // Fetch prompts from Firestore
    const fetchPrompts = async (userID) => {
        try {
            const genaiCollection = collection(db, 'genai', userID, 'prompts');
            const q = query(genaiCollection, limit(1000), orderBy('modifiedDateTime', 'desc'));
            const genaiSnapshot = await getDocs(q);
            const genaiList = genaiSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setGenaiPrompts(genaiList);
        } catch (error) {
            console.error("Error fetching prompts: ", error);
        }
    };

    // Function to fetch data from Firestore
    const fetchData = async (userID) => {
        try {
            const genaiCollection = collection(db, 'genai', userID, 'MyGenAI');
            let q;
            q = query(genaiCollection, orderBy('createdDateTime', 'desc'), limit(dataLimit));
            if (hindi) {
                q = query(genaiCollection, orderBy('createdDateTime', 'desc'), where('language', '==', 'Hindi'), limit(dataLimit));
            }
            if (telugu) {
                q = query(genaiCollection, orderBy('createdDateTime', 'desc'), where('language', '==', 'Telugu'), limit(dataLimit));
            }
            const genaiSnapshot = await getDocs(q);
            const genaiList = genaiSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const showFullQuestionState = {};
            genaiList.forEach(doc => {
                showFullQuestionState[doc.id] = false;
            });
            setShowFullQuestion(showFullQuestionState);
            setGenaiData(genaiList);
            setLastVisible(genaiSnapshot.docs[genaiSnapshot.docs.length - 1]); // Set last visible document
        } catch (error) {
            console.error("Error fetching data: ", error);
        }
    };

    // Handlers for input changes
    const handleLimitChange = (event) => {
        dataLimit = parseInt(event.target.value);
        bigQueryResults();
    };

    const handleSearchChange = (event) => {
        searchQuery = event.target.value;
        bigQueryResults();
    };

    const handleVectorSearchChange = (event) => {
        searchQuery = event.target.value;
        vectorSearchResults();
    };

    const [showFullQuestion, setShowFullQuestion] = useState({});

    // Helper function to split messages into chunks
    const splitMessage = (msg, chunkSize = 4000) => {
        const chunks = [];
        for (let i = 0; i < msg.length; i += chunkSize) {
            chunks.push(msg.substring(i, i + chunkSize));
        }
        return chunks;
    };

    // Function to synthesize speech
    const synthesizeSpeech = async (articles, language) => {
        // Clean the text by removing URLs and special characters
        const cleanedArticles = articles
            .replace(/https?:\/\/[^\s]+/g, '') // Remove URLs
            .replace(/http?:\/\/[^\s]+/g, '') // Remove URLs
            .replace(/[#:\-*]/g, ' ')
                        .replace(/[&]/g, ' and ')
            .replace(/[<>]/g, ' ')
            .replace(/["]/g, '&quot;')
            .replace(/[']/g, '&apos;')
            .trim(); // Remove leading/trailing spaces

        if (isiPhone) {
            window.scrollTo(0, 0);
            alert('Please go to top of the page to check status and listen to the audio');
            callTTSAPI(cleanedArticles, process.env.REACT_APP_TTS_SSML_API_URL);
            return;
        }
        try {
            try {
                const speechConfig = speechsdk.SpeechConfig.fromSubscription(speechKey, serviceRegion);
                speechConfig.speechSynthesisVoiceName = voiceName;
                if (language === "Spanish") {
                    speechConfig.speechSynthesisVoiceName = "es-MX-DaliaNeural";
                }
                if (language === "Hindi") {
                    speechConfig.speechSynthesisVoiceName = "hi-IN-SwaraNeural";
                }
                if (language === "Telugu") {
                    speechConfig.speechSynthesisVoiceName = "te-IN-ShrutiNeural";
                }

                const audioConfig = speechsdk.AudioConfig.fromDefaultSpeakerOutput();
                const speechSynthesizer = new speechsdk.SpeechSynthesizer(speechConfig, audioConfig);

                const chunks = splitMessage(cleanedArticles);
                for (const chunk of chunks) {
                    await new Promise((resolve, reject) => {
                        speechSynthesizer.speakTextAsync(chunk, result => {
                            if (result.reason === speechsdk.ResultReason.SynthesizingAudioCompleted) {
                                console.log(`Speech synthesized to speaker for text: [${chunk}]`);
                                resolve();
                            } else if (result.reason === speechsdk.ResultReason.Canceled) {
                                const cancellationDetails = speechsdk.SpeechSynthesisCancellationDetails.fromResult(result);
                                if (cancellationDetails.reason === speechsdk.CancellationReason.Error) {
                                    console.error(`Error details: ${cancellationDetails.errorDetails}`);
                                    reject(new Error(cancellationDetails.errorDetails));
                                } else {
                                    reject(new Error('Speech synthesis canceled'));
                                }
                            }
                        }, error => {
                            console.error(`Error synthesizing speech: ${error}`);
                            reject(error);
                        });
                    });
                }
            } catch (error) {
                console.error(`Error synthesizing speech: ${error}`);
            } finally {
                setIsLiveAudioPlaying(false);
            }
        }
        catch (error) {
            console.error(`Error synthesizing speech: ${error}`);
        }
        finally {
            setIsLiveAudioPlaying(false);
        }
    };

    // Function to fetch more data for pagination
    const fetchMoreData = async () => {
        try {
            // get auth user
            const user = auth.currentUser;
            if (!user) {
                console.error("No user is signed in");
                return;
            }
            else {
                console.log('User is signed in:', user.uid);
                const genaiCollection = collection(db, 'genai', user.uid, 'MyGenAI');
                let nextQuery;
                nextQuery = query(genaiCollection, orderBy('createdDateTime', 'desc'), startAfter(lastVisible), limit(dataLimit));
                if (hindi) {
                    nextQuery = query(genaiCollection, orderBy('createdDateTime', 'desc'), where('language', '==', 'Hindi'), startAfter(lastVisible), limit(dataLimit));
                }
                if (telugu) {
                    nextQuery = query(genaiCollection, orderBy('createdDateTime', 'desc'), where('language', '==', 'Telugu'), startAfter(lastVisible), limit(dataLimit));
                }

                const genaiSnapshot = await getDocs(nextQuery);
                const genaiList = genaiSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setGenaiData(prevData => [...prevData, ...genaiList]);
                setLastVisible(genaiSnapshot.docs[genaiSnapshot.docs.length - 1]); // Update last visible document
            }
        } catch (error) {
            console.error("Error fetching more data: ", error);
        }
    };

    const handlePromptChange = async (promptValue) => {
        /* const genaiCollection = collection(db, 'genai', uid, 'prompts');
         const q = query(genaiCollection, where('tag', '==', promptValue), limit(1));
         const genaiSnapshot = await getDocs(q);
         const genaiList = genaiSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); */
        fullPromptInput = promptValue;
    };

    // Sign Out
    const handleSignOut = () => {
        signOut(auth).catch((error) => {
            console.error('Error signing out:', error);
            alert('Error signing out: ' + error.message);
        });
    };

    const searchPrompts = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_GENAI_API_URL}search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ q: promptInput, uid: user.uid, collection: 'prompts', limit: autoPromptLimit })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to search prompts.');
            }

            const data = await response.json();
            const docIds = data.document_ids;

            const genaiCollection = collection(db, 'genai', uid, 'prompts');
            const docsQuery = query(genaiCollection, where('__name__', 'in', docIds));
            const docsSnapshot = await getDocs(docsQuery);
            const fullTexts = docsSnapshot.docs.map(doc => doc.data().fullText);
            setEditPromptFullText(fullTexts.join("\n"));
            const promptTag = docsSnapshot.docs.map(doc => doc.data().tag);
            setEditPromptTag(promptTag);
            console.log('Edit Prompt:', editPromptTag);
            console.log('Select Prompt Tag:', fullTexts);
            setSelectedPrompt(promptTag);
            setShowSourceDocument(false);
            autoPromptInput = promptInput;
            autoPromptInput = autoPromptInput + "\n" + autoPromptSeparator + "\n" + fullTexts.join("\n");
        } catch (error) {
            console.error('Error searching prompts:', error);
            alert(`Error: ${error.message}`);
        }
    };

    // **New Event Handlers for Generate and Refresh**

    // Handler for Generate Button Click
    // **Handler for Generate Button Click**
    const handleGenerate = async () => {
        setShowSourceDocument(false);
        if (!promptInput.trim()) {
            alert('Please enter a prompt.');
            return;
        }

        // Check if at least one model is selected
        if (!isOpenAI && !isAnthropic && !isGemini && !isoMini && !iso && !isImage_Dall_e_3 && !isTTS && !isLlama && !isMistral && !isGpt4Turbo && !isClaudeThink && !isGeminiSearch && !isGeminiFlash && !isGeminiThink && !isPerplexity && !isCodestral && !isClaudeHaiku && !isSambanova && !isGroq && !isNova && !isCerebras && !isDeepSeek) {
            alert('Please select at least one model.');
            return;
        }

        if (isGroq && showGroq) {
            setIsGeneratingGroq(true); // Set generating state to true
            callAPI(modelGroq);
        }

        if (isSambanova && showSambanova) {
            setIsGeneratingSambanova(true); // Set generating state to true
            callAPI(modelSambanova);
        }

        if (isClaudeHaiku && showClaudeHaiku) {
            setIsGeneratingClaudeHaiku(true); // Set generating state to true
            callAPI(modelClaudeHaiku);
        }

        // Generate API calls for each selected model
        if (isAnthropic && showAnthropic) {
            setIsGeneratingAnthropic(true); // Set generating state to true
            callAPI(modelAnthropic);
        }

        if (isGemini && showGemini) {
            setIsGeneratingGemini(true); // Set generating state to true
            callAPI(modelGemini);
        }
        if (isOpenAI && showOpenAI) {
            setIsGenerating(true); // Set generating state to true
            callAPI(modelOpenAI);
        }

        if (isoMini && showoMini) {
            setIsGeneratingoMini(true); // Set generating state to true
            callAPI(modeloMini);
        }

        if (iso && showo) {
            setIsGeneratingo(true); // Set generating state to true
            callAPI(modelo);
        }

        if (isLlama && showLlama) {
            setIsGeneratingLlama(true); // Set generating state to true
            callAPI(modelLlama);
        }

        if (isMistral && showMistral) {
            setIsGeneratingMistral(true); // Set generating state to true
            callAPI(modelMistral);
        }

        if (isClaudeThink && showClaudeThink) {
            setIsGeneratingClaudeThink(true); // Set generating state to true
            callAPI(modelClaudeThink);
        }

        if (isGeminiSearch && showGeminiSearch) {
            setIsGeneratingGeminiSearch(true); // Set generating state to true
            callAPI(modelGeminiSearch);
        }

        if (isGeminiFlash && showGeminiFlash) {
            setIsGeneratingGeminiFlash(true); // Set generating state to true
            callAPI(modelGeminiFlash);
        }

        if (isGpt4Turbo && showGpt4Turbo) {
            setIsGeneratingGpt4Turbo(true); // Set generating state to true
            callAPI(modelGpt4Turbo);
        }

        if (isGeminiThink && showGeminiThink) {
            setIsGeneratingGeminiThink(true); // Set generating state to true
            callAPI(modelGeminiThink);
        }

        if (isPerplexity && showPerplexity) {
            setIsGeneratingPerplexity(true); // Set generating state to true
            callAPI(modelPerplexity);
        }

        if (isCodestral && showCodeStral) {
            setIsGeneratingCodeStral(true); // Set generating state to true
            callAPI(modelCodestralApi);
        }

        // **Handle DALL·E 3 Selection**
        if (isImage_Dall_e_3 && showImageDallE3) {
            setIsGeneratingImage_Dall_e_3(true); // Set generating state to true
            callAPI(modelImageDallE3);
        }

        // **Handle TTS Selection**
        if (isTTS && showTTS) {
            // if promptInput is > 9000 characters, then split it into chunks and call TTS API for each chunk
            //

            if (promptInput.length > 2) {
                /* const chunks = [];
                 for (let i = 0; promptInput.length; i += 3999) {
                   chunks.push(promptInput.substring(i, i + 3999));
                 }
                 for (const chunk of chunks) {
                   callTTSAPI(chunk);
                 }*/
                callTTSAPI(promptInput, process.env.REACT_APP_TTS_SSML_API_URL);
            }

        }

        if (isNova && showNova) {
            setIsGeneratingNova(true); // Set generating state to true
            callAPI(modelNova);
        }

        if (isCerebras && showCerebras) {
            setIsGeneratingCerebras(true); // Set generating state to true
            callAPI(modelCerebras);
        }

        if (isDeepSeek && showDeepSeek) {
            setIsGeneratingDeepSeek(true); // Set generating state to true
            callAPI(modelDeepSeek);
        }

        try {
            const configurationCollection = collection(db, 'genai', user.uid, 'configuration');
            const q = query(configurationCollection, where('setup', '==', 'genai'));
            const configSnapshot = await getDocs(q);
            if (configSnapshot.empty) {
                console.log('No configuration found');
                return;
            }
            configSnapshot.forEach(async (doc) => {
                await updateDoc(doc.ref, {
                    // Model states
                    isOpenAI,
                    isAnthropic,
                    isGemini,
                    isoMini,
                    isLlama,
                    isMistral,
                    isGpt4Turbo,
                    isGeminiSearch,
                    isGeminiFlash,
                    isGeminiThink,
                    isPerplexity,
                    isCodestral,
                    isClaudeHaiku,
                    iso,
                    isSambanova, // Add this line
                    isGroq,
                    isNova,
                    isCerebras,
                    isDeepSeek,

                    // Feature states
                    isTTS,
                    isImage_Dall_e_3,

                    // Parameters
                    temperature,
                    top_p,
                    dataLimit,
                    autoPrompt,

                    // Update timestamp
                    lastUpdated: new Date()
                }, { merge: true });
            });  // Optionally, refresh data

        } catch (error) {
            console.error('Error updating configuration:', error);
        }
    };

    const callAPI = async (selectedModel, invocationType = '') => {
        console.log('Calling API with model:', selectedModel + ' URL: ' + process.env.REACT_APP_GENAI_API_URL, ' youtubeSelected: ', youtubeSelected, ' youtubePromptInput:', youtubePromptInput);
        try {
            let response;
            switch (invocationType) {
                case 'youtubeTitleDescription':
                    response = await fetch(process.env.REACT_APP_GENAI_API_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ prompt: youtubePromptInput, model: selectedModel, uid: uid, temperature: temperature, top_p: top_p })
                    });
                    break;
                case 'imagesSearchWords':
                    response = await fetch(process.env.REACT_APP_GENAI_API_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ prompt: imagePromptInput, model: selectedModel, uid: uid, temperature: temperature, top_p: top_p })
                    });
                    break;
                case 'homeWork':
                    response = await fetch(process.env.REACT_APP_GENAI_API_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ prompt: homeWorkInput, model: selectedModel, uid: uid, temperature: temperature, top_p: top_p })
                    });
                    break;
                case 'google-search':
                    response = await fetch(process.env.REACT_APP_GENAI_API_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ prompt: googleSearchPromptInput, model: selectedModel, uid: uid, temperature: temperature, top_p: top_p })
                    });
                    break;
                default:
                    if (autoPrompt) {
                        await searchPrompts();
                        console.log('Prompt:', autoPromptInput);
                        response = await fetch(process.env.REACT_APP_GENAI_API_URL, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ prompt: autoPromptInput, model: selectedModel, uid: uid, temperature: temperature, top_p: top_p })
                        });
                    }
                    else {
                        let finalPrompt = promptInput;
                        if (fullPromptInput.length > 2) {
                            finalPrompt = promptInput + autoPromptSeparator + fullPromptInput;
                        }
                        response = await fetch(process.env.REACT_APP_GENAI_API_URL, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ prompt: finalPrompt, model: selectedModel, uid: uid, temperature: temperature, top_p: top_p })
                        });
                    }
            }
            if (!response.ok) {
                const errorData = await response.json();
                alert(errorData.error + 'Failed to generate content');
                throw new Error(errorData.error || 'Failed to generate content.');
            }
            const data = await response.json();
            console.log('Response:', data);
        } catch (error) {
            console.error('Error generating content:', error);
            alert(`Error: ${error.message}`);
        } finally {
            // click refresh button
            searchQuery = '';
            searchModel = 'All';
            youtubeSelected = false;
            imageSelected = false;
            setIsHomeWork(false);
            setIsYouTubeTitle(false);
            setIsImagesSearch(false);
            setIsGeneratingGeminiSearch(false);
            setIsAISearch(false);
            console.log('Fetching data after generating content');
            fetchData(uid);
            if (selectedModel === modelOpenAI) {
                setIsGenerating(false);
            }
            if (selectedModel === modelAnthropic) {
                setIsGeneratingAnthropic(false);
            }
            if (selectedModel === modelGemini) {
                setIsGeneratingGemini(false);
            }
            if (selectedModel === modeloMini) {
                setIsGeneratingoMini(false);
            }
            if (selectedModel === modelo) {
                setIsGeneratingo(false);
            }
            if (selectedModel === modelImageDallE3) {
                setIsGeneratingImage_Dall_e_3(false);
            }
            if (selectedModel === modelMistral) {
                setIsGeneratingMistral(false);
            }
            if (selectedModel === modelLlama) {
                setIsGeneratingLlama(false);
            }
            if (selectedModel === modelGpt4Turbo) {
                setIsGeneratingGpt4Turbo(false);
            }
            if (selectedModel === modelClaudeThink) {
                setIsGeneratingClaudeThink(false);
            }
            if (selectedModel === modelGeminiSearch) {
                setIsGeneratingGeminiSearch(false);
            }
            if (selectedModel === modelGeminiFlash) {
                setIsGeneratingGeminiFlash(false);
            }
            if (selectedModel === modelGeminiThink) {
                setIsGeneratingGeminiThink(false);
            }
            if (selectedModel === modelPerplexity) {
                setIsGeneratingPerplexity(false);
            }
            if (selectedModel === modelCodestralApi) {
                setIsGeneratingCodeStral(false);
            }
            if (selectedModel === 'Claude-Haiku') {
                setIsGeneratingClaudeHaiku(false);
            }
            if (selectedModel === modelSambanova) {
                setIsGeneratingSambanova(false);
            }
            if (selectedModel === modelGroq) {
                setIsGeneratingGroq(false);
            }
            if (selectedModel === modelNova) {
                setIsGeneratingNova(false);
            }
            if (selectedModel === modelCerebras) {
                setIsGeneratingCerebras(false);
            }
            if (selectedModel === modelDeepSeek) {
                setIsGeneratingDeepSeek(false);
            }
        }
    };

    // Function to call the TTS API
    const callTTSAPI = async (message, apiUrl) => {

        setIsGeneratingTTS(true); // Set generating state to true
        const cleanedArticles = message
            .replace(/https?:\/\/[^\s]+/g, '')
            .replace(/http?:\/\/[^\s]+/g, '')
            .replace(/[#:\-*]/g, ' ')
            .replace(/[&]/g, ' and ')
            .replace(/[<>]/g, ' ')
            .replace(/["]/g, '&quot;')
            .replace(/[']/g, '&apos;')
            .trim();
            console.log('Calling TTS API with message:', cleanedArticles, ' voiceName:', voiceName);
            console.log('API URL:', apiUrl);
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: cleanedArticles,
                    uid: uid,
                    source: 'ai',
                    voice_name: voiceName,
                    chunk_size: chunk_size,
                    silence_break: silence_break
                })
            });

            if (!response.ok) {
                throw new Error([`Network response was not ok: ${response.statusText}`]);
            }
        } catch (error) {
            console.error('Error calling TTS API:', error);
            alert([`Error: ${error.message}`]);
        } finally {
            setIsGeneratingTTS(false); // Reset generating state
            // Optionally, refresh data
            fetchData(uid);
        }
    };
    // Handler for DALL·E 3 Checkbox Change
    const handleDall_e_3Change = async (checked) => {
        if (checked) {
            // Turn off TTS if it's on
            setIsTTS(false);
            setShowTTS(false);
            // Turn off all text models
            setVisibilityOfTextModels(false);
        } else {
            // Restore model states from configuration
            await fetchGenAIParameters(uid);
            setShowTemp(true);
            setShowTop_p(true);
        }
        setIsImage_Dall_e_3(checked);
    };

    // Handler for TTS Checkbox Change
    const handleTTSChange = async (checked) => {
        if (checked) {
            // Turn off Image if it's on
            setIsImage_Dall_e_3(false);
            setShowImageDallE3(false);
            // Turn off all text models
            setVisibilityOfTextModels(false);
        } else {
            // Restore model states from configuration
            await fetchGenAIParameters(uid);
            setShowTemp(true);
            setShowTop_p(true);
        }
        setIsTTS(checked);
    };

    // Add this helper function to manage text model visibility
    const setVisibilityOfTextModels = (status) => {
        // Set all "is" states to false/true
        setIsOpenAI(status);
        setIsAnthropic(status);
        setIsGemini(status);
        setIsoMini(status);
        setIso(status);
        setIsLlama(status);
        setIsMistral(status);
        setIsGpt4Turbo(status);
        setIsClaudeThink(status);
        setIsGeminiSearch(status);
        setIsGeminiFlash(status);
        setIsGeminiThink(status);
        setIsPerplexity(status);
        setIsCodestral(status);
        setIsClaudeHaiku(status);
        setIsSambanova(status);
        setIsGroq(status);
        setIsNova(status);
        setIsCerebras(status);
        setIsDeepSeek(status);

        // Set all "show" states to false/true
        setShowOpenAI(status);
        setShowAnthropic(status);
        setShowGemini(status);
        setShowoMini(status);
        setShowo(status);
        setShowLlama(status);
        setShowMistral(status);
        setShowGpt4Turbo(status);
        setShowClaudeThink(status);
        setShowGeminiSearch(status);
        setShowGeminiFlash(status);
        setShowGeminiThink(status);
        setShowPerplexity(status);
        setShowCodeStral(status);
        setShowClaudeHaiku(status);
        setShowSambanova(status);
        setShowGroq(status);
        setShowNova(status);
        setShowCerebras(status);
    };

    // Add this helper function to handle LLM model selection
    const handleLLMChange = (setter, value) => {
        setter(value);
        if (value) {
            // Turn off TTS and Image
            setIsTTS(false);
            setIsImage_Dall_e_3(false);
        }
    };

    const handleEditPrompt = () => {
        setShowEditPopup(true);
        setShowSaveButton(true);
        if (selectedPrompt) {
            setEditPromptTag(selectedPrompt);
            setEditPromptFullText(selectedPromptFullText);
        }
    };

    const handleEditSource = async () => {
        if (selectedPrompt) {
            setShowSaveButton(true);
            setShowEditPopup(true);
        }
    };

    const handleModelChange = (modelValue) => {
        searchModel = modelValue;
        bigQueryResults();
    }

    const vectorSearchResults = async () => {
        setIsLoading(true);
        console.log("Fetching data for Vector search query:", searchQuery);
        console.log("URL:", process.env.REACT_APP_GENAI_API_VECTOR_URL);
        fetch(process.env.REACT_APP_GENAI_API_VECTOR_URL, {
            method: "POST",
            body: JSON.stringify({
                uid: uid,
                q: searchQuery,
                limit: dataLimit,
            })
        })
            .then((res) => res.json())
            .then(async (data) => {
                const docIds = data.document_ids;
                const genaiCollection = collection(db, 'genai', uid, 'MyGenAI');
                const docsQuery = query(genaiCollection, where('__name__', 'in', docIds));
                const docsSnapshot = await getDocs(docsQuery);
                const genaiList = docsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setGenaiData(genaiList);
                setIsLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching data:", error);
                setIsLoading(false);
            });
    }

    const bigQueryResults = () => {
        setIsLoading(true);
        console.log("Fetching data for search query:", searchQuery);
        console.log("search model:", searchModel);
        console.log("limit:", dataLimit);
        console.log("URL:", process.env.REACT_APP_GENAI_API_BIGQUERY_URL);
        fetch(process.env.REACT_APP_GENAI_API_BIGQUERY_URL, {
            method: "POST",
            body: JSON.stringify({
                uid: uid,
                limit: dataLimit,
                q: searchQuery,
                model: searchModel
            })
        })
            .then((res) => res.json())
            .then((data) => {
                setGenaiData(data);
                setIsLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching data:", error);
                setIsLoading(false);
            });
    }
    if (showMainApp) {
        return (
            <App user={user} />
        );
    }

    // Update saveReaction function to include docId
    const saveReaction = async (docId, reaction) => {
        try {
            const docRef = doc(db, 'genai', uid, 'MyGenAI', docId);
            await updateDoc(docRef, {
                reaction: reaction,
                updatedAt: new Date()
            });

            // Update local state to reflect the change
            const updatedData = genaiData.map(item => {
                if (item.id === docId) {
                    return { ...item, reaction: reaction };
                }
                return item;
            });
            setGenaiData(updatedData);
        } catch (error) {
            console.error('Error saving reaction:', error);
        }
    };

    const handleIconClick = (event) => {
        event.target.classList.add('icon-animation');
        setTimeout(() => {
            event.target.classList.remove('icon-animation');
        }, 1000);
    };

    const handleHomeWork = async () => {
        setIsHomeWork(true);
        // Ensure genaiPrompts is populated
        if (genaiPrompts.length === 0) {
            await fetchPrompts(uid); // Fetch prompts if not already loaded
        }

        // Correct the tag name and add null check
        const prompt = genaiPrompts.find(prompt => prompt.tag === 'Questions');
        let intelligentQuestionsPrompt = prompt ? prompt.fullText : '';

        if (intelligentQuestionsPrompt === '') {
            intelligentQuestionsPrompt = '--------- please generate practice questions based on the topic(s) mentioned above ---------  Text from below is prompt purpose only :::::::::::::::: Rules for practice questions for home work to students ::::* design 20 questions that are tricky, intelligent and brain twister questions    * questions should provoke thinking in student mind * ask questions with more practical and real-life scenarios ### ---------  response should be  markdown table with only two columns1. Category2. Question------------------------';
            console.error('Intelligent-Questions prompt not found.');
        }

        // Append the prompt to promptInput
        homeWorkInput = promptInput + intelligentQuestionsPrompt;
        setIsGeneratingGemini(true);
        callAPI(modelGemini, 'homeWork');
        setIsGeneratingoMini(true); // Set generating state to true
        callAPI(modeloMini, 'homeWork');
    };

    // Add handler for AI Search
    const handleAISearch = async () => {
        setIsAISearch(true);
        // Ensure genaiPrompts is populated
        if (genaiPrompts.length === 0) {
            await fetchPrompts(uid); // Fetch prompts if not already loaded
        }

        // Correct the tag name and add null check
        const prompt = genaiPrompts.find(prompt => prompt.tag === 'Search-GenAI');
        let googleSearchPrompt = prompt ? prompt.fullText : '';

        if (googleSearchPrompt === '') {
            googleSearchPrompt = '  ####  prompt starts from here #####  search for current, up-to-date and latest news and information about above topic(s) from google search. --Provide response with maximum details possible in response. Use all max tokens available to the max in response.';
        }
        // Append the search prompt to promptInput
        googleSearchPromptInput = promptInput + googleSearchPrompt;
        setIsGeneratingGeminiSearch(true);
        // Call the API with gemini-search model
        await callAPI(modelGeminiSearch, 'google-search');
    };

    return (
        <div>
            <div className={`main-content ${showEditPopup ? 'dimmed' : ''}`}>
                <div>
                    {email === 'erpgenai@gmail.com' &&
                        (<h3>This site is created by Sharath K for Demo purpose only.</h3>)
                    }
                    <textarea
                        className="promptInput"
                        value={promptInput}
                        onChange={(e) => setPromptInput(e.target.value)}
                        placeholder="Enter your prompt here..."
                    />
                </div>
                <div style={{ marginBottom: '20px' }}>
                    {showGroq && (
                        <button className={isGroq ? 'button_selected' : 'button'} onClick={() => handleLLMChange(setIsGroq, !isGroq)}>
                            <label className={isGeneratingGroq ? 'flashing' : ''}>{labelGroq}</label>
                        </button>
                    )}
                    {showSambanova && (
                        <button className={isSambanova ? 'button_selected' : 'button'} onClick={() => handleLLMChange(setIsSambanova, !isSambanova)}>
                            <label className={isGeneratingSambanova ? 'flashing' : ''}>{labelSambanova}</label>
                        </button>
                    )}
                    {showOpenAI && (
                        <button className={isOpenAI ? 'button_selected' : 'button'}
                            onClick={() => handleLLMChange(setIsOpenAI, !isOpenAI)}>
                            <label className={isGenerating ? 'flashing' : ''}>{labelOpenAI}</label>
                        </button>
                    )}
                    {showAnthropic && (
                        <button className={isAnthropic ? 'button_selected' : 'button'}
                            onClick={() => handleLLMChange(setIsAnthropic, !isAnthropic)}>
                            <label className={isGeneratingAnthropic ? 'flashing' : ''}>{labelAnthropic}</label>
                        </button>
                    )}
                    {showGemini && (
                        <button className={isGemini ? 'button_selected' : 'button'}
                            onClick={() => handleLLMChange(setIsGemini, !isGemini)}>
                            <label className={isGeneratingGemini ? 'flashing' : ''}>{labelGemini}</label>
                        </button>
                    )}
                    {showoMini && (
                        <button className={isoMini ? 'button_selected' : 'button'}
                            onClick={() => handleLLMChange(setIsoMini, !isoMini)}>
                            <label className={isGeneratingoMini ? 'flashing' : ''}>{labeloMini}</label>
                        </button>
                    )}
                    {showMistral && (
                        <button className={isMistral ? 'button_selected' : 'button'}
                            onClick={() => handleLLMChange(setIsMistral, !isMistral)}>
                            <label className={isGeneratingMistral ? 'flashing' : ''}>{labelMistral}</label>
                        </button>
                    )}
                    {showLlama && (
                        <button className={isLlama ? 'button_selected' : 'button'}
                            onClick={() => handleLLMChange(setIsLlama, !isLlama)}>
                            <label className={isGeneratingLlama ? 'flashing' : ''}>{labelLlama}</label>
                        </button>
                    )}
                    {showGpt4Turbo && (
                        <button className={isGpt4Turbo ? 'button_selected' : 'button'}
                            onClick={() => handleLLMChange(setIsGpt4Turbo, !isGpt4Turbo)}>
                            <label className={isGeneratingGpt4Turbo ? 'flashing' : ''}>{labelGpt4Turbo}</label>
                        </button>
                    )}
                    {showGeminiSearch && (
                        <button className={isGeminiSearch ? 'button_selected' : 'button'}
                            onClick={() => handleLLMChange(setIsGeminiSearch, !isGeminiSearch)}>
                            <label className={isGeneratingGeminiSearch ? 'flashing' : ''}>{labelGeminiSearch}</label>
                        </button>
                    )}
                    {showGeminiFlash && (
                        <button
                            className={isGeminiFlash ? 'button_selected' : 'button'}
                            onClick={() => handleLLMChange(setIsGeminiFlash, !isGeminiFlash)}
                        >
                            <label className={isGeneratingGeminiFlash ? 'flashing' : ''}>
                                {labelGeminiFlash}
                            </label>
                        </button>
                    )}
                    {showClaudeThink && (
                        <button className={isClaudeThink ? 'button_selected' : 'button'}
                            onClick={() => handleLLMChange(setIsClaudeThink, !isClaudeThink)}>
                            <label className={isGeneratingClaudeThink ? 'flashing' : ''}>{labelClaudeThink}</label>
                        </button>
                    )}
                    {showo && (
                        <button className={iso ? 'button_selected' : 'button'}
                            onClick={() => handleLLMChange(setIso, !iso)}>
                            <label className={isGeneratingo ? 'flashing' : ''}>{labelo}</label>
                        </button>
                    )}
                    {showGeminiThink && (
                        <button className={isGeminiThink ? 'button_selected' : 'button'}
                            onClick={() => handleLLMChange(setIsGeminiThink, !isGeminiThink)}>
                            <label className={isGeneratingGeminiThink ? 'flashing' : ''}>{labelGeminiThink}</label>
                        </button>
                    )}
                    {showPerplexity && (
                        <button className={isPerplexity ? 'button_selected' : 'button'}
                            onClick={() => handleLLMChange(setIsPerplexity, !isPerplexity)}>
                            <label className={isGeneratingPerplexity ? 'flashing' : ''}>{labelPerplexity}</label>
                        </button>
                    )}
                    {showCodeStral && (
                        <button className={isCodestral ? 'button_selected' : 'button'}
                            onClick={() => handleLLMChange(setIsCodestral, !isCodestral)}>
                            <label className={isGeneratingCodeStral ? 'flashing' : ''}>{labelCodestral}</label>
                        </button>
                    )}
                    {showClaudeHaiku && (
                        <button className={isClaudeHaiku ? 'button_selected' : 'button'}
                            onClick={() => handleLLMChange(setIsClaudeHaiku, !isClaudeHaiku)}>
                            <label className={isGeneratingClaudeHaiku ? 'flashing' : ''}>{labelClaudeHaiku}</label>
                        </button>
                    )}
                    {showNova && (
                        <button className={isNova ? 'button_selected' : 'button'}
                            onClick={() => handleLLMChange(setIsNova, !isNova)}>
                            <label className={isGeneratingNova ? 'flashing' : ''}>{labelNova}</label>
                        </button>
                    )}
                    {showCerebras && (
                        <button className={isCerebras ? 'button_selected' : 'button'}
                            onClick={() => handleLLMChange(setIsCerebras, !isCerebras)}>
                            <label className={isGeneratingCerebras ? 'flashing' : ''}>{labelCerebras}</label>
                        </button>
                    )}
                    {showDeepSeek && (
                        <button 
                            className={isDeepSeek ? 'button_selected' : 'button'}
                            onClick={() => handleLLMChange(setIsDeepSeek, !isDeepSeek)}
                        >
                            <label className={isGeneratingDeepSeek ? 'flashing' : ''}>
                                {labelDeepSeek}
                            </label>
                        </button>
                    )}
                    {showTemp && (
                        <label style={{ marginLeft: '8px' }}>
                            Temp:
                            <input
                                type="number"
                                value={temperature}
                                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                                step="0.1"
                                min="0"
                                max="1"
                                style={{ width: '50px', marginLeft: '5px' }}
                            />
                        </label>
                    )}
                    {showTop_p && (
                        <label style={{ marginLeft: '8px' }}>
                            Top_p:
                            <input
                                type="number"
                                value={top_p}
                                onChange={(e) => setTop_p(parseFloat(e.target.value))}
                                step="0.1"
                                min="0"
                                max="1"
                                style={{ width: '50px', marginLeft: '5px' }}
                            />
                        </label>
                    )}
                    {showImageDallE3 &&
                        <button className={isImage_Dall_e_3 ? 'button_selected' : 'button'}
                            onClick={() => handleDall_e_3Change(!isImage_Dall_e_3)}>
                            <label className={isGeneratingImage_Dall_e_3 ? 'flashing' : ''}>
                                Image    <img src={imageIcon} alt="image" style={{ width: '16px', verticalAlign: 'middle', marginLeft: '4px' }} />
                            </label>
                        </button>
                    }
                    {showTTS &&
                        <button className={isTTS ? 'button_selected' : 'button'}
                            onClick={() => handleTTSChange(!isTTS)}>
                            <label className={isGeneratingTTS ? 'flashing' : ''}>
                                Audio    <img src={speakerIcon} alt="speaker" height="16px" />
                            </label>
                        </button>
                    }
                    {showPrompt && (
                        <select className="promptDropdownInput" id="promptSelect"
                            onChange={(e) => {
                                handlePromptChange(e.target.value);
                                setSelectedPrompt(e.target.options[e.target.selectedIndex].text);
                                setSelectedPromptFullText(e.target.value);
                            }}
                            style={{ marginLeft: '2px', padding: '2px', fontSize: '16px' }}
                        >
                            <option value="NA">Select Prompt</option>
                            {genaiPrompts.map((prompt) => (
                                <option key={prompt.id} value={prompt.fullText}>{prompt.tag}</option>
                            ))}
                        </select>
                    )}
                    {showPrompt && (
                        <button
                            className="signonpagebutton"
                            onClick={() => handleEditPrompt()}
                            style={{ padding: '10px', background: 'lightblue', fontSize: '16px' }}
                        >
                            <FaEdit />
                        </button>
                    )}
                    &nbsp; 
                    {isUploading && (
                      <FaSpinner className="spinning"/>
                    )}
                    {showPrompt && (<input
                        type="file"
                        accept=".pdf,.docx,.pptx,.xlsx,.xls"
                        style={{ marginLeft: '8px', padding: '2px', fontSize: '18px' }}
                        onChange={async (e) => {
                            const file = e.target.files[0];
                            if (file) {
                                const formData = new FormData();
                                formData.append('file', file);
                                formData.append('uid', uid);
                                try {
                                    setIsUploading(true); // Show spinning wheel
                                    const response = await fetch(`${process.env.REACT_APP_GENAI_API_URL}md`, {
                                        method: 'POST',
                                        body: formData
                                    });
                 
                                    if (!response.ok) {
                                        const errorData = await response.json();
                                        throw new Error(errorData.error || 'Failed to upload document.');
                                    }
                                    const data = await response.json();
                                    console.log('Upload Response:', data);
                                    const genaiCollection = collection(db, 'genai', uid, 'prompts');
                                    const currentDateTime = new Date();
                                    const promptSize = data.markdown.length;
                                    console.log('Adding new prompt from uploaded document');
                                    const newDocRef = await addDoc(genaiCollection, {
                                        tag: 'new prompt',
                                        fullText: data.markdown,
                                        createdDateTime: currentDateTime,
                                        modifiedDateTime: currentDateTime,
                                        size: promptSize
                                    });
                                    const docId = newDocRef.id;
                                    console.log('Document ID:', docId);
                                    embedPrompt(docId);
                                    fetchPrompts(uid);
                                    setIsUploading(false); // Hide spinning wheel
                                    alert('Document uploaded successfully!');
                                } catch (error) {
                                    console.error('Error uploading document:', error);
                                    alert(`Error: ${error.message}`);
                                }
                            }
                        }}
                    />
                    )}
                    {showAutoPrompt && (
                        <button className={autoPrompt ? 'button_selected' : 'button'} onClick={() => setAutoPrompt(!autoPrompt)}>
                            AutoPrompt
                        </button>
                    )}
                    {!isAISearch && !isHomeWork && (
                        <button
                            onClick={handleGenerate}
                            className="generateButton"
                            style={{ marginLeft: '16px', padding: '9px 9px', fontSize: '16px' }}
                            disabled={
                                isGenerating ||
                                isGeneratingGemini ||
                                isGeneratingAnthropic ||
                                isGeneratingoMini ||
                                isGeneratingo ||
                                isGeneratingImage_Dall_e_3 ||
                                isGeneratingTTS ||
                                isGeneratingMistral ||
                                isGeneratingLlama ||
                                isGeneratingGpt4Turbo ||
                                isGeneratingGeminiSearch ||
                                isGeneratingGeminiFlash ||
                                isGeneratingPerplexity ||
                                isGeneratingGeminiThink ||
                                isGeneratingCodeStral ||
                                isGeneratingClaudeThink ||
                                isGeneratingClaudeHaiku ||
                                isGeneratingSambanova ||
                                isGeneratingGroq ||
                                isGeneratingNova ||
                                isGeneratingCerebras ||
                                isGeneratingDeepSeek
                            }
                        >
                            {isGenerating ||
                                isGeneratingGemini ||
                                isGeneratingAnthropic ||
                                isGeneratingoMini ||
                                isGeneratingo ||
                                isGeneratingImage_Dall_e_3 ||
                                isGeneratingTTS ||
                                isGeneratingMistral ||
                                isGeneratingLlama ||
                                isGeneratingGpt4Turbo ||
                                isGeneratingGeminiSearch ||
                                isGeneratingGeminiFlash ||
                                isGeneratingPerplexity ||
                                isGeneratingGeminiThink ||
                                isGeneratingCodeStral ||
                                isGeneratingClaudeThink ||
                                isGeneratingClaudeHaiku ||
                                isGeneratingSambanova ||
                                isGeneratingGroq ||
                                isGeneratingNova ||
                                isGeneratingCerebras ||
                                isGeneratingDeepSeek ? (
                                <FaSpinner className="spinning" />
                            ) : (
                                'Execute'
                            )}
                        </button>
                    )}
                    {(showHomeWorkButton && !isAISearch &&
                        <button
                            onClick={handleHomeWork}
                            className="generateButton"
                            style={{ marginLeft: '16px', padding: '9px 9px', fontSize: '16px', background: 'brown' }}
                        >
                            {isHomeWork
                                ? (
                                    <FaSpinner className="spinning" />
                                ) : (
                                    'HomeWork'
                                )}
                        </button>
                    )}
                    {showAISearchButton && !isHomeWork && (
                        <button
                            onClick={handleAISearch}
                            className="generateButton"
                            style={{ marginLeft: '16px', padding: '9px 9px', fontSize: '16px', background: '#4285f4' }}
                        >
                            {isAISearch ? (<FaSpinner className="spinning" />) : ('GoogleSearch + GenAI')}
                        </button>
                    )}
                    &nbsp; &nbsp;
                    {!GenAIParameter ? (
                        <button className='signoutbutton' onClick={() => setShowMainApp(!showMainApp)}>
                            <FaArrowLeft />
                        </button>
                    ) : (
                        <button className='signoutbutton' onClick={handleSignOut}><FaSignOutAlt /> </button>
                    )}
                    &nbsp; &nbsp;
                    <label style={{ fontSize: '16px', color: 'gray', marginTop: '10px' }}>
                        {email}
                    </label>
                    {autoPrompt && selectedPrompt && showSourceDocument && (
                        <div style={{ marginTop: '10px', fontSize: '16px' }}>
                            Source document(s): <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleEditSource();
                                }}
                                className="sourceDocumentButton"
                            >
                                {selectedPrompt}

                            </button>
                        </div>
                    )}
                </div>
                <label>
                    Limit:
                    <input
                        className="limitInput"
                        type="number"
                        onBlur={(event) => handleLimitChange(event)}
                        onKeyDown={(event) => (event.key === "Enter" || event.key === "Tab") && handleLimitChange(event)}
                        defaultValue={dataLimit}
                        min={1}
                    />
                </label>
                <input
                    className="searchInput"
                    type="text"
                    onKeyDown={(event) => (event.key === "Enter" || event.key === "Tab") && handleVectorSearchChange(event)}
                    placeholder="Semantic or Vector Search"
                />
                <input
                    className="searchInput"
                    type="text"
                    onKeyDown={(event) => (event.key === "Enter" || event.key === "Tab") && handleSearchChange(event)}
                    placeholder="Keyword Search"
                />

                <select
                    className="modelInput"
                    value={searchModel}
                    onChange={(e) => handleModelChange(e.target.value)}
                    style={{ marginLeft: '2px', padding: '2px', fontSize: '16px' }}
                >
                    <option value="All">All</option>
                    <option value="chatgpt-4o-latest">ChatGPT</option>
                    <option value="gemini-1.5-pro-002">Gemini</option>
                    <option value="claude-3-5-sonnet-latest">Claude</option>
                    <option value="o-mini">o-mini</option>
                    <option value="o-preview">o</option>
                    <option value="azure-tts">Audio</option>
                    <option value="dall-e-3">Image</option>
                    <option value="Mistral-large-2407">Mistral</option>
                    <option value="meta-llama-3.1-405b-instruct">Llama</option>
                    <option value="gpt-4-turbo">Gpt4Turbo</option>
                    <option value="gpt-4o-mini">ClaudeThink</option>
                    <option value="gemini-search">GeminiSearch</option>
                    <option value="gemini-flash">Gemini Flash</option>
                    <option value="perplexity-fast">GeminiThink</option>
                    <option value="perplexity">Perplexity</option>
                    <option value="codestral">CodeStral</option>
                    <option value="Claude-Haiku">Claude-Haiku</option>
                    <option value="sambanova-1">Sambanova</option>
                    <option value="groq-mixtral">Groq</option>
                    <option value="nova">Nova</option>
                    <option value="llama-c">Cerebras</option>
                    <option value="DeepSeek">DeepSeek</option>
                </select>
                {showEditPopup && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <br />
                            <h3>Add/Edit Prompt</h3>
                            <label>Tag:</label>
                            <input
                                type="text"
                                value={editPromptTag}
                                onChange={(e) => setEditPromptTag(e.target.value)}
                                className="promptTag"
                            />
                            <br />
                            <MdEditor
                                style={{ height: '500px', fontSize: '2rem' }}
                                value={editPromptFullText}
                                renderHTML={editPromptFullText => mdParser.render(editPromptFullText)}
                                onChange={({ text }) => setEditPromptFullText(text)}
                                config={{ view: { menu: true, md: false, html: true } }}
                            />
                            <div>
                                {showSaveButton && (<button onClick={handleSavePrompt} className="signinbutton">Save</button>)}
                                <button onClick={() => setShowEditPopup(false)} className="signoutbutton">Cancel</button>
                            </div>
                            <br />
                            <br />
                        </div>
                    </div>
                )}
                {/* **Display Generated Response** 
          {generatedResponse && (
            <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '20px', borderRadius: '5px' }}>
              <h3>Response is generated, click Refresh button to see results</h3>
            </div>
          )}*/}

                {/* **Existing Data Display** */}
                <div>
                    {isLoading && <p> Loading Data...</p>}
                    {!isLoading && <div>
                        {genaiData.map((item) => (
                            <div className="outputDetailsFormat" key={item.createdDateTime}>
                                <div className="responseFormat">
                                    <h4 style={{ color: "brown" }}>
                                        <span style={{ color: "#a3780a", fontWeight: "bold" }}> Prompt </span>
                                        @ <span style={{ color: "black", fontSize: "16px" }}>{new Date(item.createdDateTime).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}</span>
                                        &nbsp;
                                        on <span style={{ color: "grey", fontSize: "16px" }}>{new Date(item.createdDateTime).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                        &nbsp;&nbsp;
                                        <span style={{ color: "blue", fontSize: "16px" }}>{item.model}   </span>
                                        &nbsp;
                                        <button onClick={() => {
                                            const updatedData = genaiData.map(dataItem => {
                                                if (dataItem.id === item.id) {
                                                    return { ...dataItem, showRawQuestion: !dataItem.showRawQuestion };
                                                }
                                                return dataItem;
                                            });
                                            setGenaiData(updatedData);
                                        }}>
                                            {item.showRawQuestion ? <FaMarkdown /> : <FaEnvelopeOpenText />}
                                        </button>
                                        &nbsp; &nbsp;
                                        <span style={{ color: "black", fontSize: "12px" }}>  #Char(Q): </span><span style={{ color: "darkblue", fontSize: "16px" }}> {item.question?.length || 0}
                                        </span>
                                    </h4>
                                    <div style={{ fontSize: '16px' }}>
                                        {item.showRawQuestion ? item.question : (showFullQuestion[item.id] ? <ReactMarkdown>{item.question}</ReactMarkdown> : <ReactMarkdown>{getQuestionSubstring(item.question)}</ReactMarkdown>)}
                                    </div>
                                    <button onClick={() => {
                                        setShowFullQuestion(prev => ({
                                            ...prev,
                                            [item.id]: !prev[item.id]
                                        }));
                                    }}>            {showFullQuestion[item.id] ? 'Less' : 'More'}
                                    </button>

                                </div>
                                <div style={{ border: "1px solid black" }}>
                                    <div style={{ color: "green", fontWeight: "bold" }}>---- Response ----
                                        {item.model !== 'dall-e-3' && item.model !== 'azure-tts' && (
                                            <>

                                                {(showYouTubeButton && <button
                                                    className={
                                                        (isGeneratingYouTubeAudioTitle[item.id]) ?
                                                            'button_selected' : 'button'
                                                    }
                                                    onClick={() => {
                                                        setIsGeneratingYouTubeAudioTitle(prev => ({ ...prev, [item.id]: true }));
                                                        setIsGeneratingTTS(true);
                                                        callTTSAPI(item.answer, process.env.REACT_APP_TTS_SSML_API_URL);

                                                        // Execute YouTube Title/Description
                                                        youtubePromptInput = youtubeTitlePrompt + item.answer;
                                                        youtubeSelected = true;
                                                        setIsYouTubeTitle(true);
                                                        setIsGemini(true);
                                                        setIsGeneratingGemini(true);
                                                        callAPI(modelGemini, 'youtubeTitleDescription');

                                                        // Execute Image Search
                                                        imagePromptInput = imagesSearchPrompt + item.answer;
                                                        imageSelected = true;
                                                        setIsImagesSearch(true);
                                                        setIso(true);
                                                        setIsGeneratingo(true);
                                                        callAPI(modelo, 'imagesSearchWords').finally(() => setIsGeneratingYouTubeAudioTitle(prev => ({ ...prev, [item.id]: false })));;
                                                    }}>
                                                    <label className={
                                                        (isGeneratingYouTubeAudioTitle[item.id]) ?
                                                            'flashing' : ''
                                                    }>
                                                        YouTube Audio                                                         <img src={speakerIcon} alt="speaker" height="22px" style={{ marginRight: '4px' }} />
                                                        / Title - Description                                                    <img src={youtubeIcon} alt="youtube" height="22px" style={{ marginRight: '4px' }} />
                                                        / Image Search Words
                                                        <img src={imageIcon} alt="" height="22px" style={{ marginRight: '4px' }} />
                                                    </label>
                                                </button>
                                                )}

                                                {(!isiPhone &&
                                                    <button
                                                        className={isLiveAudioPlaying[item.id] ? 'button_selected' : 'button'}
                                                        onClick={async () => {
                                                            try {
                                                                setIsLiveAudioPlaying(prev => ({ ...prev, [item.id]: true }));
                                                                const result = await synthesizeSpeech(item.answer, item.language || "English");
                                                                if (!result) {
                                                                    throw new Error('Speech synthesis failed');
                                                                }
                                                            } catch (error) {
                                                                console.error('Error playing audio:', error);
                                                            }
                                                        }}
                                                    >
                                                        <label className={isLiveAudioPlaying[item.id] ? 'flashing' : ''}>
                                                            <FaPlay /> Audio
                                                        </label>
                                                    </button>
                                                )}

                                                <button
                                                    className={isGeneratingDownloadableAudio[item.id] ? 'button_selected' : 'button'}
                                                    onClick={() => {
                                                        setIsGeneratingDownloadableAudio(prev => ({ ...prev, [item.id]: true }));
                                                        callTTSAPI(item.answer, process.env.REACT_APP_TTS_SSML_API_URL)
                                                            .finally(() => setIsGeneratingDownloadableAudio(prev => ({ ...prev, [item.id]: false })));
                                                    }}
                                                >
                                                    <label className={isGeneratingDownloadableAudio[item.id] ? 'flashing' : ''}>
                                                        <FaCloudDownloadAlt /> Audio
                                                    </label>
                                                </button>

                                            </>
                                        )}
                                        &nbsp; &nbsp; &nbsp;
                                        <button onClick={() => {
                                            const updatedData = genaiData.map(dataItem => {
                                                if (dataItem.id === item.id) {
                                                    return { ...dataItem, showRawAnswer: !dataItem.showRawAnswer };
                                                }
                                                return dataItem;
                                            });
                                            setGenaiData(updatedData);
                                        }}>
                                            {item.showRawAnswer ? <FaMarkdown /> : <FaEnvelopeOpenText />}
                                        </button>
                                        &nbsp; &nbsp;
                                        <span style={{ color: "black", fontSize: "12px" }}> #Char(Ans):</span>
                                        <span style={{ color: "darkblue", fontSize: "16px" }}> {item.answer?.length || 0} </span>
                                        &nbsp; &nbsp;
                                        <button
                                            edge="end"
                                            aria-label="print answer"
                                            className="button"
                                            onClick={() => {
                                                const printWindow = window.open('', '', 'height=500,width=800');
                                                const htmlContent = mdParser.render(item.answer);
                                                printWindow.document.write('<html><head><title>Print</title>');
                                                printWindow.document.write('<style>');
                                                printWindow.document.write(`
                                                    body {
                                                        font-family: Arial, sans-serif;
                                                        margin: 20px;
                                                    }
                                                    table {
                                                        width: 100%;
                                                        border-collapse: collapse;
                                                        margin-bottom: 20px;
                                                    }
                                                    table, th, td {
                                                        border: 1px solid #ccc;
                                                    }
                                                    th, td {
                                                        padding: 8px;
                                                        text-align: left;
                                                    }
                                                    th {
                                                        background-color: #f2f2f2;
                                                    }
                                                    pre {
                                                        background-color: #f5f5f5;
                                                        padding: 10px;
                                                        overflow: auto;
                                                    }
                                                    code {
                                                        background-color: #f5f5f5;
                                                        padding: 2px 4px;
                                                    }
                                                `);
                                                printWindow.document.write('</style></head><body>');
                                                printWindow.document.write(htmlContent);
                                                printWindow.document.write('</body></html>');
                                                printWindow.document.close();
                                                printWindow.print();
                                            }}
                                        >
                                            Print <FaPrint />
                                        </button>
                                    </div>
                                    <div style={{ fontSize: '16px' }}>
                                        {item.showRawAnswer ? item.answer : (<MdEditor
                                            value={editPromptFullText}
                                            renderHTML={editPromptFullText => mdParser.render(item.answer)}
                                            config={{ view: { menu: true, md: true, html: true } }}
                                        />)}
                                    </div>

                                    <br />
                                    <br />
                                    {/* Add reaction buttons JSX */}
                                    <div className="reaction-buttons">
                                        <button
                                            className={`reaction-btn ${item.reaction === 'love' ? 'active' : ''}`}
                                            onClick={() => saveReaction(item.id, 'love')}
                                        >
                                            👍👍 Helpful
                                        </button>
                                        <button
                                            className={`reaction-btn ${item.reaction === 'like' ? 'active' : ''}`}
                                            onClick={() => saveReaction(item.id, 'like')}
                                        >
                                            👍 Informative
                                        </button>
                                        <button
                                            className={`reaction-btn ${item.reaction === 'improve' ? 'active' : ''}`}
                                            onClick={() => saveReaction(item.id, 'improve')}
                                        >
                                            🤔 Could be better
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button className="fetchButton" onClick={fetchMoreData} style={{ marginTop: '20px', padding: '10px 20px', fontSize: '16px' }}>
                            Show more information
                        </button>
                    </div>}
                </div>
            </div>
        </div>
    );
};

export default GenAIApp;
