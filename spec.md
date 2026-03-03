# BEST LANGUAGE TRANSLATION

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- Full-stack translation app supporting 70 world languages
- Text input field for users to type text to translate
- Voice input (speech-to-text) supporting any of the 70 languages -- users can speak in their native language
- Audio output (text-to-speech) that reads translated text aloud in the target language
- Language selector for both source and target languages (with auto-detect option for source)
- Translation history stored in the backend -- saves source text, source language, target language, translated text, and timestamp
- Ability to replay audio for any history entry
- Clear/delete individual history entries
- Corporate, clean, professional UI design

### Modify
- N/A (new project)

### Remove
- N/A (new project)

## Implementation Plan

### Backend (Motoko)
- Data model: `TranslationRecord` with fields: id, sourceText, sourceLang, targetLang, translatedText, timestamp
- Store history as a stable array/map
- API endpoints:
  - `saveTranslation(record)` -- save a completed translation to history
  - `getHistory()` -- return all saved translations sorted by newest first
  - `deleteTranslation(id)` -- remove a specific history entry
  - `clearHistory()` -- remove all history entries

### Frontend (React + TypeScript)
- Main translation panel:
  - Source language selector (dropdown with 70 languages + "Auto-detect" option)
  - Target language selector (dropdown with 70 languages)
  - Text input textarea for source text
  - Microphone button to trigger speech-to-text (using Web Speech API, respects selected source language)
  - "Translate" button
  - Output panel showing translated text
  - Speaker button to play translated text via text-to-speech (using Web Speech API, respects selected target language)
  - Language swap button (swap source/target)
- Translation history panel:
  - List of past translations with source/target language labels, source snippet, translated result, and timestamp
  - Replay audio button per history item
  - Delete button per history item
  - Clear all button
- Responsive layout suitable for desktop and mobile
- Professional, corporate color scheme (blues, whites, neutrals)

### Supported Languages (70)
Afrikaans, Albanian, Amharic, Arabic, Armenian, Azerbaijani, Basque, Belarusian, Bengali, Bosnian, Bulgarian, Catalan, Cebuano, Chinese (Simplified), Chinese (Traditional), Croatian, Czech, Danish, Dutch, English, Esperanto, Estonian, Finnish, French, Galician, Georgian, German, Greek, Gujarati, Haitian Creole, Hausa, Hebrew, Hindi, Hmong, Hungarian, Icelandic, Igbo, Indonesian, Irish, Italian, Japanese, Javanese, Kannada, Khmer, Korean, Lao, Latin, Latvian, Lithuanian, Macedonian, Malay, Malayalam, Maltese, Maori, Marathi, Mongolian, Nepali, Norwegian, Persian, Polish, Portuguese, Punjabi, Romanian, Russian, Serbian, Sinhala, Slovak, Slovenian, Somali, Spanish, Sundanese, Swahili, Swedish, Tagalog, Tamil, Telugu, Thai, Turkish, Ukrainian, Urdu, Uzbek, Vietnamese, Welsh, Xhosa, Yiddish, Yoruba, Zulu

Note: Actual translation is performed in the browser using a free translation API (LibreTranslate or MyMemory) via HTTP fetch. The backend only stores history.
