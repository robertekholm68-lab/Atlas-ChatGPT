# ASKR Voice Log adapter

Version 1 uses one-shot Web Speech recognition. `createSpeechRecognitionAdapter` also accepts a
`nativeAdapter` implementing `supported`, `start`, `stop` and `abort`. A future Capacitor speech
recognition plugin can therefore be injected at app bootstrap without changing the parser, preview
or workout integration. Audio and raw transcripts are never persisted.
