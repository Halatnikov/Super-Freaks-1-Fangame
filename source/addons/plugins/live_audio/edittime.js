function GetPluginSettings()
{
	return {
		"name":			"LiveAudio",
		"id":			"LiveAudio",
		"version":		"1.0",
		"description":	"Preprocess music and play with music data.",
		"author":		"XYZT (thanks to p5.js and Howler.js)",
		"help url":		"http://www.scirra.com/manual/109/audio",
		"dependency":   "howler.core.min.js;howler.js",
		"category":		"Media",
		"type":			"object",
		"rotatable":	false,
		"flags":		pf_singleglobal
	};
}

//////////////////////////////////////////////////////////////
// Conditions
AddStringParam("Tag", "The audio tag of the file.");
AddCondition(0, 0, "Is tag playing", "LiveAudio", "Tag <b>{0}</b> is playing", "True if audio with a given tag is currently playing.", "IsTagPlaying");

AddStringParam("Tag", "The audio tag of the file.");
AddCondition(1, 0, "Is tag loaded", "LiveAudio", "Tag <b>{0}</b> is loaded", "True if audio with a given tag is loaded.", "IsTagLoaded");

AddStringParam("Tag", "The audio tag of the file.");
AddCondition(2, 0, "Is tag buffered", "LiveAudio", "Tag <b>{0}</b> is buffered", "True if audio with a given tag is buffered (ready to get preprocessed data).", "IsTagBuffered");

AddStringParam("Tag", "The audio tag of the file.");
AddCondition(3, 0, "Is tag buffering", "LiveAudio", "Tag <b>{0}</b> is buffering", "True if audio with a given tag is currently buffering (getting data).", "IsTagBuffering");

AddStringParam("Tag", "The audio tag of the file.");
AddCondition(4, 0, "Is tag looping", "LiveAudio", "Tag <b>{0}</b> is looping", "True if audio with a given tag is looping.", "IsTagLooping");

AddStringParam("Tag", "The audio tag of the file.");
AddCondition(5, 0, "Is tag muted", "LiveAudio", "Tag <b>{0}</b> is muted", "True if audio with a given tag is muted.", "IsTagMuted");

AddStringParam("Tag", "The audio tag of the file.");
AddCondition(100, 0, "Is FFT active", "LiveAudio - FFT", "Is FFT for <b>{0}</b> active", "True if FFT for a given tag is active.", "IsFFTActive");

AddStringParam("Tag", "The audio tag of the file.");
AddCondition(200, 0, "Is Preprocessor active", "LiveAudio - Preprocessor", "Is Preprocessor for <b>{0}</b> active", "True if Preprocessor for a given tag is active.", "IsPreprocessorActive");

AddStringParam("Tag", "The audio tag of the file.");
AddCondition(300, 0, "Is Amplitude Processor active", "LiveAudio - Amplitude Processor", "Is Amplitude Processor for <b>{0}</b> active", "True if Amplitude Processor for a given tag is active.", "IsAmplitudeProcessorActive");

AddStringParam("Tag", "The audio tag of the file.");
AddCondition(400, 0, "Is Simple Beat Detection active", "LiveAudio - Simple Beat Detection", "Is Simple Beat Detection for <b>{0}</b> active", "True if Simple Beat Detection for a given tag is active.", "IsBeatDetectionActive");

AddStringParam("Tag", "The audio tag of the file.");
AddCondition(401, 0, "Is Beat Detected", "LiveAudio - Simple Beat Detection", "Is beat detected for <b>{0}</b>", "True if Simple Beat Detection detected a beat.", "IsBeatDetected");
//////////////////////////////////////////////////////////////
// Actions

//#region P5JS_ACTIONS
AddStringParam("Path", "Path to a file to load.");
AddStringParam("Tag", "A tag to reference this file in future.", "\"\"", 1);
AddAction(0, 0, "Load a file", "LiveAudio", "Load <b>{0}</b> to tag <i>{1}</i>", "Load an audio file.", "LoadFile");

AddStringParam("Tag", "A tag referenced to a file.", "\"\"", 1);
AddAction(1, 0, "Play a tag", "LiveAudio", "Play tag <i>{0}</i>", "Play a tag.", "PlayTag");

AddStringParam("Tag", "A tag referenced to a file.", "\"\"", 1);
AddAction(2, 0, "Stop a tag", "LiveAudio", "Stop tag <i>{0}</i>", "Stop a tag.", "StopTag");

AddStringParam("Tag", "A tag referenced to a file.", "\"\"", 1);
AddComboParamOption("not looping");
AddComboParamOption("looping");
AddComboParam("Loop", "If a file should loop (repeat) after it reach it's end.", 0, 2);
AddNumberParam("Volume", "1 is original volume (max), 0.5 half as loud, 0 is muted (min)", "1");
AddAction(50, 0, "Play a tag (more options)", "LiveAudio", "Play tag <b>{0}</b> {1} at volume {2}", "Play an audio file with more options.", "PlayWithMoreOptions");

AddStringParam("Tag", "A tag referenced to a file.", "\"\"", 1);
AddComboParamOption("looping");
AddComboParamOption("not looping");
AddComboParam("State", "Choose whether to turn looping on or off.");
AddAction(51, 0, "Set looping", "LiveAudio", "Set <i>{0}</i> {1}", "Enable or disable looping on a sound.", "SetLooping");

AddStringParam("Tag", "A tag referenced to a file.", "\"\"", 1);
AddComboParamOption("muted");
AddComboParamOption("unmuted");
AddComboParam("State", "Choose whether to mute or unmute the sound.");
AddAction(52, 0, "Set muted", "LiveAudio", "Set <i>{0}</i> {1}", "Mute (make silent) or unmute a sound.", "SetMuted");

AddStringParam("Tag", "A tag referenced to a file.", "\"\"");
AddNumberParam("Volume", "1 is original volume (max), 0.5 half as loud, 0 is muted (min)", "1");
AddAction(53, 0, "Set volume", "LiveAudio", "Set <i>{0}</i> volume to <b>{1}</b>", "Set the volume (loudness) of a sound.", "SetVolume");

AddStringParam("Tag", "A tag referenced to a file.", "\"\"");
AddNumberParam("Playback rate", "The rate of playback. 1.0 is normal speed, 0.5 half speed, 2.0 double speed, etc.", "1.0");
AddAction(54, 0, "Set playback rate", "LiveAudio", "Set <i>{0}</i> playback rate to <b>{1}</b>", "Set the speed at which a sound plays at.", "SetPlaybackRate");

AddNumberParam("Time", "Time in seconds (can be float value).");
AddStringParam("Tag", "A tag referenced to a file.", "\"\"");
AddAction(55, 0, "Seek to", "LiveAudio", "Seek to <i>{0}</i> for tag <i>{1}</i>", "Seek to time (in seconds) for tag.", "SeekToTime");

AddNumberParam("Smoothing", "Smoothing of frequency data. [0 - 1]", "0.5");
AddNumberParam("Bins", "Number of frequency bins. [must be number of power of 2]", "512");
AddStringParam("Tag", "A tag referenced to a file.", "\"\"");
AddAction(100, 0, "Add FFT to tag", "LiveAudio - FFT", "Add FFT to tag <i>{2}</i> (smoothing <b>{0}</b>, bins <b>{1}</b>)", "Add FFT to tag.", "AddFFTForTag");

AddNumberParam("Smoothing", "Smoothing of frequency data. [0 - 1]", "0.5");
AddStringParam("Tag", "A tag referenced to a file.", "\"\"");
AddAction(101, 0, "Set smoothing", "LiveAudio - FFT", "Set <i>{0}</i> smoothing to <b>{1}</b>", "Set smoothing of FFT.", "SetSmoothingToFFT");

AddStringParam("Tag", "A tag referenced to a file.", "\"\"");
AddAction(200, 0, "Load buffer", "LiveAudio - Preprocessor", "Load buffer to tag <i>{0}</i>", "Load buffer to tag.", "LoadBufferForTag");

AddStringParam("Tag", "A tag referenced to a file.", "\"\"");
AddAction(201, 0, "Add Preprocessor", "LiveAudio - Preprocessor", "Add Preprocessor to tag <i>{0}</i>", "Add Preprocessor to tag.", "AddPreprocessorForTag");

AddNumberParam("Buffer Size", "Buffer size of channel data. (power of 2)", "2048");
AddStringParam("Tag", "A tag referenced to a file.", "\"\"");
AddAction(202, 0, "Set Buffer Size", "LiveAudio - Preprocessor", "Set <i>{0}</i> buffer size for tag <i>{1}</i>", "Set buffer size for tag.", "SetBufferSizeToPreprocessor");

AddNumberParam("Smoothing", "Smoothing of amplitude processing. [0 - 1]", "0.5");
AddStringParam("Tag", "A tag referenced to a file.", "\"\"");
AddAction(300, 0, "Add Amplitude Processor", "LiveAudio - Amplitude Processor", "Add Amplitude Processor to tag <i>{1}</i> with smoothing <b>{0}</b>", "Add Amplitude Processor to tag.", "AddAmplitudeProcessorForTag");

AddStringParam("Tag", "A tag referenced to a file.", "\"\"");
AddAction(301, 0, "Process Amplitude (For Current Time)", "LiveAudio - Amplitude Processor", "Process Amplitude for current time for tag <i>{0}</i>", "Process Amplitude for current time for tag.", "ProcessAmplitudeForTagCurrent");

AddNumberParam("Time", "Time in seconds.");
AddStringParam("Tag", "A tag referenced to a file.", "\"\"");
AddAction(302, 0, "Process Amplitude (For X Time)", "LiveAudio - Amplitude Processor", "Process Amplitude at <i>{0}</i> for tag <i>{1}</i>", "Process Amplitude at time (in seconds) for tag.", "ProcessAmplitudeForTagTime");

AddNumberParam("Smoothing", "Smoothing of amplitude processing. [0 - 1]", "0.5");
AddStringParam("Tag", "A tag referenced to a file.", "\"\"");
AddAction(303, 0, "Set smoothing", "LiveAudio - Amplitude Processor", "Set <i>{0}</i> smoothing <i>{1}</i>", "Set smoothing of Amplitude Processor.", "SetSmoothingToAmplitudeProcessor");

AddStringParam("Tag", "A tag referenced to a file.", "\"\"");
AddAction(400, 0, "Add Simple Beat Detection", "LiveAudio - Simple Beat Detection", "Add Simple Beat Detection to tag <i>{0}</i>", "Add Simple Beat Detection to tag.", "AddSimpleBeatDetection");

AddStringParam("Tag", "A tag referenced to a file.", "\"\"");
AddAction(401, 0, "Detect Beat", "LiveAudio - Simple Beat Detection", "Detect Beat for tag <i>{0}</i>", "Detect Beat for tag.", "DetectBeatForTag");

AddNumberParam("beatHoldFrames", "How many frames to hold for next beat to detect.", "30");
AddStringParam("Tag", "A tag referenced to a file.", "\"\"");
AddAction(402, 0, "Set beatHoldFrames", "LiveAudio - Simple Beat Detection", "Set <i>{0}</i> beatHoldFrames to <b>{1}</b>", "Set beatHoldFrames of Simple Beat Detection.", "SetBeatHoldFrames");

AddNumberParam("beatThreshold", "Amplitude level that triggers a beat. [0 - 1]", "0.11");
AddStringParam("Tag", "A tag referenced to a file.", "\"\"");
AddAction(403, 0, "Set beatThreshold", "LiveAudio - Simple Beat Detection", "Set <i>{0}</i> beatThreshold to <b>{1}</b>", "Set beatThreshold of Simple Beat Detection.", "SetBeatThreshold");

AddNumberParam("beatDecayRate", "How fast will beatCutoff (when beats, 1.1*beatThreshold) decay. [0 - 1]", "0.98");
AddStringParam("Tag", "A tag referenced to a file.", "\"\"");
AddAction(404, 0, "Set beatDecayRate", "LiveAudio - Simple Beat Detection", "Set <i>{0}</i> beatDecayRate to <b>{1}</b>", "Set beatDecayRate of Simple Beat Detection.", "SetBeatDecayRate");

//////////////////////////////////////////////////////////////
// Expressions

//#region P5JS_EXPRESSIONS
AddStringParam("Tag", "A tag referenced to a file.", "\"\"");
AddExpression(0, ef_return_number, "LiveAudio", "LiveAudio", "isTagLoaded", "Get 0 or 1 if file on tag is loaded.");

AddStringParam("Tag", "A tag referenced to a file.", "\"\"");
AddExpression(1, ef_return_number, "LiveAudio", "LiveAudio", "isTagPlaying", "Get 0 or 1 if file on tag is playing.");

AddStringParam("Tag", "A tag referenced to a file.", "\"\"");
AddExpression(2, ef_return_number, "LiveAudio", "LiveAudio", "isTagBuffered", "Get 0 or 1 if file on tag is buffered (ready to get preprocessed data).");

AddStringParam("Tag", "A tag referenced to a file.", "\"\"");
AddExpression(50, ef_return_number, "LiveAudio", "LiveAudio", "isTagLooping", "Get 0 or 1 if tag is looping.");

AddStringParam("Tag", "A tag referenced to a file.", "\"\"");
AddExpression(51, ef_return_number, "LiveAudio", "LiveAudio", "isTagMuted", "Get 0 or 1 if tag is muted.");

AddStringParam("Tag", "A tag referenced to a file.", "\"\"");
AddExpression(52, ef_return_number, "LiveAudio", "LiveAudio", "getVolume", "Get current time of tag.");

AddStringParam("Tag", "A tag referenced to a file.", "\"\"");
AddExpression(53, ef_return_number, "LiveAudio", "LiveAudio", "getRate", "Get playback rate of tag.");

AddStringParam("Tag", "A tag referenced to a file.", "\"\"");
AddExpression(54, ef_return_number, "LiveAudio", "LiveAudio", "getCurrentTime", "Get current time of tag.");

AddStringParam("Tag", "A tag referenced to a file.", "\"\"");
AddExpression(55, ef_return_number, "LiveAudio", "LiveAudio", "getDuration", "Get duration of tag.");

AddNumberParam("Index", "Index of frequency bin.");
AddStringParam("Tag", "A tag referenced to a file.", "\"\"");
AddExpression(100, ef_return_number, "LiveAudio - FFT", "LiveAudio - FFT", "getByteFrequencyBinAt", "Get byte value of frequency bin at index for tag.");

AddNumberParam("Index", "Index of frequency bin.");
AddStringParam("Tag", "A tag referenced to a file.", "\"\"");
AddExpression(101, ef_return_number, "LiveAudio - FFT", "LiveAudio - FFT", "getByteTimeDomainAt", "Get byte time domain at index for tag.");

AddNumberParam("Index", "Index of frequency bin.");
AddStringParam("Tag", "A tag referenced to a file.", "\"\"");
AddExpression(102, ef_return_number, "LiveAudio - FFT", "LiveAudio - FFT", "getFloatFrequencyBinAt", "Get float value of frequency bin at index for tag.");

AddNumberParam("Index", "Index of frequency bin.");
AddStringParam("Tag", "A tag referenced to a file.", "\"\"");
AddExpression(103, ef_return_number, "LiveAudio - FFT", "LiveAudio - FFT", "getFloatTimeDomainAt", "Get float time domain at index for tag.");

AddStringParam("Tag", "A tag referenced to a file.", "\"\"");
AddComboParamOption("none");
AddComboParamOption("round");
AddComboParam("Effect", "Set if you want rounded value (if float is returned).");
AddExpression(104, ef_return_number, "LiveAudio - FFT", "LiveAudio - FFT", "getAverageByteBinValue", "Get average byte (sum / binCount) from frequency bins for tag.");

AddStringParam("Tag", "A tag referenced to a file.", "\"\"");
AddComboParamOption("none");
AddComboParamOption("round");
AddComboParam("Effect", "Set if you want rounded value (if float is returned).");
AddExpression(105, ef_return_number, "LiveAudio - FFT", "LiveAudio - FFT", "getAverageFloatBinValue", "Get average float (sum / binCount) from frequency bins for tag.");

AddStringParam("Tag", "A tag referenced to a file.", "\"\"");
AddExpression(106, ef_return_number, "LiveAudio - FFT", "LiveAudio - FFT", "getFrequencyBinCount", "Get number of frequency bins for tag.");

AddStringParam("Tag", "A tag referenced to a file.", "\"\"");
AddExpression(107, ef_return_number, "LiveAudio - FFT", "LiveAudio - FFT", "getSmoothingForFFT", "Get smoothing for tag.");

AddStringParam("Tag", "A tag referenced to a file.", "\"\"");
AddExpression(108, ef_return_number, "LiveAudio - FFT", "LiveAudio - FFT", "getPeakLevel", "Get peak value from frequency bins for tag.");

AddStringParam("Tag", "A tag referenced to a file.", "\"\"");
AddExpression(109, ef_return_number, "LiveAudio - FFT", "LiveAudio - FFT", "getRMSLevel", "Get RMS value from frequency bins for tag.");

AddStringParam("Tag", "A tag referenced to a file.", "\"\"");
AddExpression(200, ef_return_number, "LiveAudio - Amplitude Processor", "LiveAudio - Amplitude Processor", "getAmplitudeVolume", "Get amplitude volume.");

AddStringParam("Tag", "A tag referenced to a file.", "\"\"");
AddExpression(201, ef_return_number, "LiveAudio - Amplitude Processor", "LiveAudio - Amplitude Processor", "getAmplitudeVolumeNorm", "Get normalized amplitude volume.");

AddNumberParam("Index", "Index of channel.");
AddStringParam("Tag", "A tag referenced to a file.", "\"\"");
AddExpression(202, ef_return_number, "LiveAudio - Amplitude Processor", "LiveAudio - Amplitude Processor", "getAmplitudeStereo", "Get amplitude stereo volume.");

AddNumberParam("Index", "Index of channel.");
AddStringParam("Tag", "A tag referenced to a file.", "\"\"");
AddExpression(203, ef_return_number, "LiveAudio - Amplitude Processor", "LiveAudio - Amplitude Processor", "getAmplitudeStereoNorm", "Get normalized amplitude stereo volume.");

AddStringParam("Tag", "A tag referenced to a file.", "\"\"");
AddExpression(204, ef_return_number, "LiveAudio - Amplitude Processor", "LiveAudio - Amplitude Processor", "getSmoothingForAmplitudeProcessor", "Get smoothing for tag.");

AddStringParam("Tag", "A tag referenced to a file.", "\"\"");
AddExpression(300, ef_return_number, "LiveAudio - Simple Beat Detection", "LiveAudio - Simple Beat Detection", "isBeatDetected", "Get 0 or 1 if beat is detected.");

AddStringParam("Tag", "A tag referenced to a file.", "\"\"");
AddExpression(301, ef_return_number, "LiveAudio - Simple Beat Detection", "LiveAudio - Simple Beat Detection", "getBeatHoldFrames", "Get value of beatHoldFrames.");

AddStringParam("Tag", "A tag referenced to a file.", "\"\"");
AddExpression(302, ef_return_number, "LiveAudio - Simple Beat Detection", "LiveAudio - Simple Beat Detection", "getBeatThreshold", "Get value of beatThreshold.");

AddStringParam("Tag", "A tag referenced to a file.", "\"\"");
AddExpression(303, ef_return_number, "LiveAudio - Simple Beat Detection", "LiveAudio - Simple Beat Detection", "getBeatCutoff", "Get value of beatCutoff.");

AddStringParam("Tag", "A tag referenced to a file.", "\"\"");
AddExpression(304, ef_return_number, "LiveAudio - Simple Beat Detection", "LiveAudio - Simple Beat Detection", "getBeatDecayRate", "Get value of beatDecayRate.");

AddStringParam("Tag", "A tag referenced to a file.", "\"\"");
AddExpression(305, ef_return_number, "LiveAudio - Simple Beat Detection", "LiveAudio - Simple Beat Detection", "getFramesSinceLastBeat", "Get value of framesSinceLastBeat.");

AddStringParam("Tag", "A tag referenced to a file.", "\"\"");
AddExpression(400, ef_return_number, "LiveAudio - Preprocessor", "LiveAudio - Preprocessor", "getLengthForPreprocessor", "Get length of buffer.");

AddStringParam("Tag", "A tag referenced to a file.", "\"\"");
AddExpression(401, ef_return_number, "LiveAudio - Preprocessor", "LiveAudio - Preprocessor", "getChannelCountForPreprocessor", "Get number of channels of buffer.");

AddStringParam("Tag", "A tag referenced to a file.", "\"\"");
AddExpression(402, ef_return_number, "LiveAudio - Preprocessor", "LiveAudio - Preprocessor", "getSampleRateForPreprocessor", "Get sample rate of buffer.");

AddStringParam("Tag", "A tag referenced to a file.", "\"\"");
AddExpression(403, ef_return_number, "LiveAudio - Preprocessor", "LiveAudio - Preprocessor", "getBufferSizeForPreprocessor", "Get buffer size of buffer.");

AddNumberParam("Index", "Index of channel.");
AddNumberParam("Time", "Time in seconds.");
AddStringParam("Tag", "A tag referenced to a file.", "\"\"");
AddExpression(404, ef_return_string, "LiveAudio - Preprocessor", "LiveAudio - Preprocessor", "getChannelData", "Get channel data in the size of buffer joined with '|' character (e.g use tokenat (bufferSize - 1) times).");

AddNumberParam("Index", "Index of channel.");
AddNumberParam("Time", "Time in seconds.");
AddStringParam("Tag", "A tag referenced to a file.", "\"\"");
AddExpression(405, ef_return_number, "LiveAudio - Preprocessor", "LiveAudio - Preprocessor", "getChannelDataSum", "Get buffer size of buffer.");

//#endregion

ACESDone();

// Property grid properties for this plugin
var property_list = [];
	
// Called by IDE when a new object type is to be created
function CreateIDEObjectType()
{
	return new IDEObjectType();
}

// Class representing an object type in the IDE
function IDEObjectType()
{
	assert2(this instanceof arguments.callee, "Constructor called as a function");
}

// Called by IDE when a new object instance of this type is to be created
IDEObjectType.prototype.CreateInstance = function(instance)
{
	return new IDEInstance(instance, this);
}

// Class representing an individual instance of an object in the IDE
function IDEInstance(instance, type)
{
	assert2(this instanceof arguments.callee, "Constructor called as a function");
	
	// Save the constructor parameters
	this.instance = instance;
	this.type = type;
	
	// Set the default property values from the property table
	this.properties = {};
	
	for (var i = 0; i < property_list.length; i++)
		this.properties[property_list[i].name] = property_list[i].initial_value;
}

// Called by the IDE after all initialization on this instance has been completed
IDEInstance.prototype.OnCreate = function()
{
}

// Called by the IDE after a property has been changed
IDEInstance.prototype.OnPropertyChanged = function(property_name)
{
}
	
// Called by the IDE to draw this instance in the editor
IDEInstance.prototype.Draw = function(renderer)
{
}

// Called by the IDE when the renderer has been released (ie. editor closed)
// All handles to renderer-created resources (fonts, textures etc) must be dropped.
// Don't worry about releasing them - the renderer will free them - just null out references.
IDEInstance.prototype.OnRendererReleased = function()
{
}
