// ECMAScript 5 strict mode
"use strict";

assert2(cr, "cr namespace not created");
assert2(cr.plugins_, "cr.plugins_ not created");

/////////////////////////////////////
// Plugin class
cr.plugins_.LiveAudio = function(runtime)
{
	this.runtime = runtime;
};

(function ()
{
	var pluginProto = cr.plugins_.LiveAudio.prototype;
		
	/////////////////////////////////////
	// Object type class
	pluginProto.Type = function(plugin)
	{
		this.plugin = plugin;
		this.runtime = plugin.runtime;
	};

	pluginProto.Instance = function(type){
		this.type = type;
		this.runtime = type.runtime;
		this.runtime.tickMe(this);
	};

	var instanceProto = pluginProto.Instance.prototype;
	
	instanceProto.onCreate = function (){};
	
	instanceProto.onInstanceDestroyed = function (inst){};

	instanceProto.tick = function ()
	{
		for(let keytag of Object.keys(taggedFiles)){
			if(taggedFiles[keytag].fft){
				taggedFiles[keytag].fft.tick();
			}
		}
	};

	var typeProto = pluginProto.Type.prototype;

	typeProto.onCreate = function()
	{
	};

	var taggedFiles = [];

	//////////////////////////////////////
	// Helper functions
	var freqToFloat = function freqToFloat(fft) {
		if (!fft.freqDomain instanceof Float32Array) {
			fft.freqDomain = new Float32Array(fft.analyser.frequencyBinCount);
		}
	};
	
	var freqToInt = function freqToInt(fft) {
		if (!fft.freqDomain instanceof Uint8Array) {
		  fft.freqDomain = new Uint8Array(fft.analyser.frequencyBinCount);
		}
	};
	
	var timeToFloat = function timeToFloat(fft) {
		if (!fft.timeDomain instanceof Float32Array) {
		  fft.timeDomain = new Float32Array(fft.analyser.frequencyBinCount);
		}
	};
	
	var timeToInt = function timeToInt(fft) {
		if (!fft.timeDomain instanceof Uint8Array) {
		  fft.timeDomain = new Uint8Array(fft.analyser.frequencyBinCount);
		}
	};

	function linearToDb(x)
	{
		if (x < 0)
			x = 0;
		if (x > 1)
			x = 1;
		return linearToDb_nocap(x);
	}
	
	function linearToDb_nocap(x)
	{
		return (Math.log(x) / Math.log(10)) * 20;
	}

	//////////////////////////////////////
	// Objects
	class RingBuffer {
		/**
		 * @constructor
		 * @param  {number} length Buffer length in frames.
		 * @param  {number} channelCount Buffer channel count.
		 */
		constructor(length, channelCount) {
			this._readIndex = 0;
			this._writeIndex = 0;
			this._framesAvailable = 0;
			this._channelCount = channelCount;
			this._length = length;
			this._channelData = [];

			for (var i = 0; i < this._channelCount; ++i) {
				this._channelData[i] = new Float32Array(length);
			}
		}

		/**
		 * Push a sequence of Float32Arrays to buffer.
		 *
		 * @param  {array} arraySequence A sequence of Float32Arrays.
		 */
		push(arraySequence) {
			// The channel count of arraySequence and the length of each channel must
			// match with this buffer obejct.
			// Transfer data from the |arraySequence| storage to the internal buffer.
			var sourceLength = arraySequence[0].length;

			for (var i = 0; i < sourceLength; ++i) {
				var writeIndex = (this._writeIndex + i) % this._length;

				for (var channel = 0; channel < this._channelCount; ++channel) {
					this._channelData[channel][writeIndex] = arraySequence[channel][i];
				}
			}

			this._writeIndex += sourceLength;

			if (this._writeIndex >= this._length) {
				this._writeIndex = 0;
			} // For excessive frames, the buffer will be overwritten.

			this._framesAvailable += sourceLength;

			if (this._framesAvailable > this._length) {
				this._framesAvailable = this._length;
			}
		}

		/**
		 * Pull data out of buffer and fill a given sequence of Float32Arrays.
		 *
		 * @param  {array} arraySequence An array of Float32Arrays.
		 */

		pull(arraySequence) {
			// The channel count of arraySequence and the length of each channel must
			// match with this buffer obejct.
			// If the FIFO is completely empty, do nothing.
			if (this._framesAvailable === 0) {
				return;
			}

			var destinationLength = arraySequence[0].length; // Transfer data from the internal buffer to the |arraySequence| storage.

			for (var i = 0; i < destinationLength; ++i) {
				var readIndex = (this._readIndex + i) % this._length;

				for (var channel = 0; channel < this._channelCount; ++channel) {
					arraySequence[channel][i] = this._channelData[channel][readIndex];
				}
			}

			this._readIndex += destinationLength;

			if (this._readIndex >= this._length) {
				this._readIndex = 0;
			}

			this._framesAvailable -= destinationLength;

			if (this._framesAvailable < 0) {
				this._framesAvailable = 0;
			}
		}

		framesAvailable() {
			return this._framesAvailable;
		}
	}

	class AmplitudeProcessor {
		constructor(outputChannels=1, inputChannels=2, normalize=false, smoothing=0.9, bufferSize=2048) {
			this.numOutputChannels = outputChannels;
			this.numInputChannels = inputChannels;
			this.normalize = normalize;
			this.smoothing = smoothing;
			this.bufferSize = bufferSize;
			this.inputRingBuffer = new RingBuffer(this.bufferSize, this.numInputChannels);
			this.outputRingBuffer = new RingBuffer(this.bufferSize, this.numOutputChannels);

			var _this = this;
			this.inputRingBufferArraySequence = new Array(this.numInputChannels).fill(null).map(function () {
				return new Float32Array(_this.bufferSize);
			});
			this.stereoVol = [0, 0];
			this.stereoVolNorm = [0, 0];
			this.volMax = 0.001;

			this.volume = {};
		}

		process(inputs, outputs) {
			var output = outputs[0];
			var smoothing = this.smoothing;
			this.inputRingBuffer.push(inputs);
			this.inputRingBuffer.pull(this.inputRingBufferArraySequence);

			for (var channel = 0; channel < this.numInputChannels; ++channel) {
				var inputBuffer = this.inputRingBufferArraySequence[channel];
				var bufLength = inputBuffer.length;
				var sum = 0;

				for (var i = 0; i < bufLength; i++) {
					var x = inputBuffer[i];

					if (this.normalize) {
						sum += Math.max(Math.min(x / this.volMax, 1), -1) * Math.max(Math.min(x / this.volMax, 1), -1);
					} else {
						sum += x * x;
					}
				}

				var rms = Math.sqrt(sum / bufLength);
				this.stereoVol[channel] = Math.max(rms, this.stereoVol[channel] * smoothing);
				this.volMax = Math.max(this.stereoVol[channel], this.volMax);
			}

			var volSum = 0;
			for (var index = 0; index < this.stereoVol.length; index++) {
				this.stereoVolNorm[index] = Math.max(Math.min(this.stereoVol[index] / this.volMax, 1), 0);
				volSum += this.stereoVol[index];
			}

			var volume = volSum / this.stereoVol.length; // normalized value
			var volNorm = Math.max(Math.min(volume / this.volMax, 1), 0);

			this.volume = {
				name: 'amplitude',
				volume: volume,
				volNorm: volNorm,
				stereoVol: this.stereoVol,
				stereoVolNorm: this.stereoVolNorm
			};

			this.outputRingBuffer.push(this.inputRingBufferArraySequence);
			this.outputRingBuffer.pull(output);
			return true;
		}

		setSmoothing(smoothing){
			this.smoothing = smoothing;
		}
	}

	function LiveAudio_Preprocessor(buffer) {
		this.buffer = buffer;
		this.bufferSize = 2048;
		this.lastData = new Float32Array(this.bufferSize);
	}

	LiveAudio_Preprocessor.prototype.getChannelDataFrom = function(channel, seconds){
		this.buffer.copyFromChannel(this.lastData, channel, this.buffer.sampleRate*seconds);
		return this.lastData;
	};

	LiveAudio_Preprocessor.prototype.getLength = function(){
		return this.buffer.length;
	};

	LiveAudio_Preprocessor.prototype.getNumberOfChannels = function(){
		return this.buffer.numberOfChannels;
	};

	LiveAudio_Preprocessor.prototype.getSampleRate = function(){
		return this.buffer.sampleRate;
	};

	LiveAudio_Preprocessor.prototype.getBufferSize = function(){
		return this.bufferSize;
	};

	LiveAudio_Preprocessor.prototype.setBufferSize = function(size){
		this.bufferSize = size;
		this.lastData = new Float32Array(this.bufferSize);
	};

	function LiveAudio_FFT(smoothing, bins, context){
		this.analyser = context.createAnalyser();
	
		this.smoothing = smoothing || 0.5;
		this.bins = bins || 1024; 
	
		this.analyser.smoothingTimeConstant = this.smoothing;
		this.freqDomainByte = new Uint8Array(this.analyser.frequencyBinCount);
		this.freqDomainFloat = new Float32Array(this.analyser.frequencyBinCount);
		this.timeDomainByte = new Uint8Array(this.analyser.frequencyBinCount);
		this.timeDomainFloat = new Float32Array(this.analyser.frequencyBinCount);

		this.peak = 0;
		this.rms = 0;
	}

	LiveAudio_FFT.prototype.setSmoothing = function(smoothing){
		this.smoothing = smoothing;
		this.analyser.smoothingTimeConstant = this.smoothing;
	};

	LiveAudio_FFT.prototype.tick = function()
	{
		this.analyser.getByteFrequencyData(this.freqDomainByte);
		this.analyser.getFloatFrequencyData(this.freqDomainFloat);
		this.analyser.getByteTimeDomainData(this.timeDomainByte);
		this.analyser.getFloatTimeDomainData(this.timeDomainFloat);

		var fftSize = this.analyser.fftSize / 2;
		var i = 0;
		this.peak = 0;
		var rmsSquaredSum = 0;
		var s = 0;
		
		for ( ; i < fftSize; i++)
		{
			// get signal as absolute value from 0 to 1 then convert to dB
			s = (this.timeDomainByte[i] - 128) / 128;
			if (s < 0)
				s = -s;
			
			if (this.peak < s)
				this.peak = s;
			
			rmsSquaredSum += s * s;			
		}
		
		this.peak = linearToDb(this.peak);
		this.rms = linearToDb(Math.sqrt(rmsSquaredSum / fftSize));
	};

	function LiveAudio_BeatDetection() {
		this.beatHoldFrames = 30;
		this.beatThreshold = 0.11;
		this.beatCutoff = 0;
		this.beatDecayRate = 0.98; // how fast does beat cutoff decay?
		this.framesSinceLastBeat = 0; // once this equals beatHoldFrames, beatCutoff starts to decay.
		this.beatDetected = false;
	}

	// level = amplitude => volume [0 - 1]
	LiveAudio_BeatDetection.prototype.detectBeat = function(level) {
		if (level > this.beatCutoff && level > this.beatThreshold){
			this.beatDetected = true;
			this.beatCutoff = level *1.2;
			this.framesSinceLastBeat = 0;
		} else {
			this.beatDetected = false;
			if (this.framesSinceLastBeat <= this.beatHoldFrames){
				this.framesSinceLastBeat ++;
			} else{
				this.beatCutoff *= this.beatDecayRate;
				this.beatCutoff = Math.max(this.beatCutoff, this.beatThreshold);
			}
		}
	};

	LiveAudio_BeatDetection.prototype.setBeatHoldFrames = function(value) {
		this.beatHoldFrames = value;
	};

	LiveAudio_BeatDetection.prototype.setBeatThreshold = function(value) {
		this.beatThreshold = value;
	};

	LiveAudio_BeatDetection.prototype.setBeatDecayRate = function(value) {
		this.beatDecayRate = value;
	};

	///////////////////////////////////////
	// SoundFile
	function LiveAudio_SoundFile(tag, path){
		this.tag = tag;
		this.path = path;

		// request
		this.request = new XMLHttpRequest();

		// variables
		this.isBuffered = false;
		this.isBuffering = false;

		// context variables
		this.contextBuffer = null;

		this.instance = new Howl({
			src: [this.path],
			onload: function(){
				this.loaded = true;
			}
		});

		this.node = this.instance._sounds[0]._node;
		this.context = this.node.context;

		// effects
		this.fft = null;
		this.preprocessor = null;
		this.amplitude = null;
		this.beatDetection = null;
	}

	LiveAudio_SoundFile.prototype.loadBuffer = function(){
		this.isBuffering = true;

		this.request.open("GET", this.path, true);
		this.request.responseType = "arraybuffer";

		var _this = this;
		this.request.onload = function(){
			_this.context.decodeAudioData(_this.request.response, function(buffer){
				_this.contextBuffer = buffer;
				_this.isBuffered = true;
				_this.isBuffering = false;
			});
		};

		this.request.send();
	};

	LiveAudio_SoundFile.prototype.addPreprocessor = function(){
		this.preprocessor = new LiveAudio_Preprocessor(this.contextBuffer);
	};

	LiveAudio_SoundFile.prototype.addFFT = function(smoothing, bins){
		this.fft = new LiveAudio_FFT(smoothing, bins, this.context);
		this.node.connect(this.fft.analyser);
	};

	LiveAudio_SoundFile.prototype.addAmplitudeProcessor = function(){
		this.amplitude = new AmplitudeProcessor();
	};

	LiveAudio_SoundFile.prototype.processAmplitudeCurrentTime = function(){
		let currentTime = this.instance.seek();
		this.processAmplitude(currentTime);
	};

	LiveAudio_SoundFile.prototype.processAmplitude = function(seconds) {
		let buffer = this.contextBuffer;

		let input1 = new Float32Array(2048);
		buffer.copyFromChannel(input1, 0, buffer.sampleRate*seconds);
		let input2 = new Float32Array(2048);
		buffer.copyFromChannel(input2, 1, buffer.sampleRate*seconds);
		let output1 = new Float32Array(2048);

		this.amplitude.process([
			input1,
			input2
		], [
			output1
		]);
	};

	LiveAudio_SoundFile.prototype.addSimpleBeatDetection = function(){
		this.beatDetection = new LiveAudio_BeatDetection();
	};

	LiveAudio_SoundFile.prototype.detectBeat = function(level){
		let x = level || this.amplitude.volume.volume;
		this.beatDetection.detectBeat(x);
	};

	LiveAudio_SoundFile.prototype.setLooping = function(looping){
		this.instance.loop(looping);
	};

	LiveAudio_SoundFile.prototype.setMuted = function(muted){
		this.instance.mute(muted);
	};

	LiveAudio_SoundFile.prototype.setVolume = function(vol){
		this.instance.volume(vol);
	};

	LiveAudio_SoundFile.prototype.setRate = function(rate){
		this.instance.rate(rate);
	};

	LiveAudio_SoundFile.prototype.seekTo = function(seconds){
		if(seconds > 0 && seconds < this.instance.duration()){
			this.instance.seek(seconds);
		}
	};

	LiveAudio_SoundFile.prototype.play = function(){
		this.instance.play();
	};

	LiveAudio_SoundFile.prototype.stop = function(){
		this.instance.stop();
	};

	//////////////////////////////////////
	// Conditions
	function Cnds() {}

	Cnds.prototype.IsTagPlaying = function (tag)
	{
		return taggedFiles[tag].instance.playing();
	};

	/**
	 * @return {boolean}
	 */
	Cnds.prototype.IsTagLoaded = function (tag)
	{
		return taggedFiles[tag].instance.loaded !== undefined;
	};

	/**
	 * @return {boolean}
	 */
	Cnds.prototype.IsTagBuffered = function (tag)
	{
		return taggedFiles[tag].isBuffered;
	};

	/**
	 * @return {boolean}
	 */
	Cnds.prototype.IsTagBuffering = function (tag)
	{
		return taggedFiles[tag].isBuffering;
	};

	/**
	 * @return {boolean}
	 */
	Cnds.prototype.IsTagLooping = function (tag)
	{
		return taggedFiles[tag].instance.loop();
	};

	/**
	 * @return {boolean}
	 */
	Cnds.prototype.IsTagMuted = function (tag)
	{
		return taggedFiles[tag].instance.mute();
	};

	/**
	 * @return {boolean}
	 */
	Cnds.prototype.IsFFTActive = function (tag)
	{
		return taggedFiles[tag].fft !== null;
	};

	/**
	 * @return {boolean}
	 */
	Cnds.prototype.IsPreprocessorActive = function (tag)
	{
		return taggedFiles[tag].preprocessor !== null;
	};

	/**
	 * @return {boolean}
	 */
	Cnds.prototype.IsAmplitudeProcessorActive = function (tag)
	{
		return taggedFiles[tag].amplitude !== null;
	};

	/**
	 * @return {boolean}
	 */
	Cnds.prototype.IsBeatDetectionActive = function (tag)
	{
		return taggedFiles[tag].beatDetection !== null;
	};

	/**
	 * @return {boolean}
	 */
	Cnds.prototype.IsBeatDetected = function (tag)
	{
		return taggedFiles[tag].beatDetection.beatDetected;
	};

	pluginProto.cnds = new Cnds();

	//////////////////////////////////////
	// Actions
	function Acts() {}

	Acts.prototype.AddFFTForTag = function(smoothing, bins, tag){
		taggedFiles[tag].addFFT(smoothing, bins);
	};

	Acts.prototype.LoadBufferForTag = function(tag){
		taggedFiles[tag].loadBuffer();
	};

	Acts.prototype.AddPreprocessorForTag = function(tag) {
		taggedFiles[tag].addPreprocessor();
	};

	Acts.prototype.AddAmplitudeProcessorForTag = function(smoothing, tag) {
		taggedFiles[tag].addAmplitudeProcessor();
		taggedFiles[tag].amplitude.setSmoothing(smoothing);
	};

	Acts.prototype.ProcessAmplitudeForTagCurrent = function(tag) {
		taggedFiles[tag].processAmplitudeCurrentTime();
	};

	Acts.prototype.ProcessAmplitudeForTagTime = function(timeInSeconds, tag){
		taggedFiles[tag].processAmplitude(timeInSeconds);
	};

	Acts.prototype.AddSimpleBeatDetection = function(tag){
		taggedFiles[tag].addSimpleBeatDetection();
	};

	Acts.prototype.DetectBeatForTag = function(tag){
		taggedFiles[tag].detectBeat();
	};

	Acts.prototype.LoadFile = function(path, tag){
		taggedFiles[tag] = new LiveAudio_SoundFile(tag, path);
	};

	Acts.prototype.PlayTag = function(tag){
		taggedFiles[tag].play();
	};
	
	Acts.prototype.StopTag = function (tag)
	{
		taggedFiles[tag].stop();
	};

	Acts.prototype.PlayWithMoreOptions = function (tag, looping, volume)
	{
		taggedFiles[tag].setLooping(looping!==0);
		taggedFiles[tag].setVolume(volume);
		taggedFiles[tag].play();
	};

	Acts.prototype.SetLooping = function (tag, looping)
	{
		taggedFiles[tag].setLooping(looping!==0);
	};

	Acts.prototype.SetMuted = function (tag, mute)
	{
		taggedFiles[tag].setMuted(mute===0);
	};

	Acts.prototype.SetVolume = function (tag, volume)
	{
		taggedFiles[tag].setVolume(volume);
	};

	Acts.prototype.SetPlaybackRate = function (tag, rate)
	{
		taggedFiles[tag].setRate(rate);
	};

	Acts.prototype.SeekToTime = function (time, tag){
		taggedFiles[tag].seekTo(time);
	};

	Acts.prototype.SetSmoothingToFFT = function (smoothing, tag){
		taggedFiles[tag].fft.setSmoothing(smoothing);
	};

	Acts.prototype.SetSmoothingToAmplitudeProcessor = function (smoothing, tag){
		taggedFiles[tag].amplitude.setSmoothing(smoothing);
	};

	Acts.prototype.SetBeatHoldFrames = function (value, tag){
		taggedFiles[tag].beatDetection.setBeatHoldFrames(value);
	};

	Acts.prototype.SetBeatThreshold = function (value, tag){
		taggedFiles[tag].beatDetection.setBeatThreshold(value);
	};

	Acts.prototype.SetBeatDecayRate = function (value, tag){
		taggedFiles[tag].beatDetection.setBeatDecayRate(value);
	};

	Acts.prototype.SetBufferSizeToPreprocessor = function (size, tag){
		taggedFiles[tag].preprocessor.setBufferSize(size);
	};
	
	pluginProto.acts = new Acts();

	//////////////////////////////////////
	// Expressions
	function Exps() {}

	Exps.prototype.getByteFrequencyBinAt = function (ret, index, tag)
	{
		return ret.set_int(taggedFiles[tag].fft.freqDomainByte[index]);
	};

	Exps.prototype.getByteTimeDomainAt = function (ret, index, tag)
	{
		return ret.set_int(taggedFiles[tag].fft.timeDomainByte[index]);
	};

	Exps.prototype.getFloatFrequencyBinAt = function (ret, index, tag)
	{
		return ret.set_float(taggedFiles[tag].fft.freqDomainFloat[index]);
	};

	Exps.prototype.getFloatTimeDomainAt = function (ret, index, tag)
	{
		return ret.set_float(taggedFiles[tag].fft.timeDomainFloat[index]);
	};

	// effect => none - nothing, round - return rounded result
	Exps.prototype.getAverageByteBinValue = function (ret, tag, effect)
	{
		let bins = taggedFiles[tag].fft.freqDomainByte;
		let result = bins.reduce((x, y) => x + y, 0);
		result /= bins.length;
		return effect === "none" ? ret.set_float(result) : ret.set_int(Math.round(result));
	};

	Exps.prototype.getAverageFloatBinValue = function (ret, tag, effect)
	{
		let bins = taggedFiles[tag].fft.freqDomainFloat;
		let result = bins.reduce((x, y) => x + y, 0);
		result /= bins.length;
		return effect === "none" ? ret.set_float(result) : ret.set_int(Math.round(result));
	};

	Exps.prototype.getFrequencyBinCount = function(ret, tag){
		return ret.set_int(taggedFiles[tag].fft.analyser.frequencyBinCount / 2);
	};

	Exps.prototype.getSmoothingForFFT = function(ret, tag){
		return ret.set_float(taggedFiles[tag].fft.smoothing);
	};

	Exps.prototype.getPeakLevel = function (ret, tag)
	{
		return ret.set_float(taggedFiles[tag].fft.peak);
	};
	
	Exps.prototype.getRMSLevel = function (ret, tag)
	{
		return ret.set_float(taggedFiles[tag].fft.rms);
	};

	Exps.prototype.isTagLoaded = function (ret, tag)
	{
		let bool = taggedFiles[tag].instance.loaded !== undefined;
		ret.set_int(Number(bool));
	};

	Exps.prototype.isTagPlaying = function(ret, tag)
	{
		let bool = taggedFiles[tag].instance.playing();
		ret.set_int(Number(bool));
	};

	Exps.prototype.isTagBuffered = function(ret, tag)
	{
		let bool = taggedFiles[tag].isBuffered;
		ret.set_int(Number(bool));
	};

	Exps.prototype.isTagLooping = function(ret, tag)
	{
		let bool = taggedFiles[tag].instance.loop();
		ret.set_int(Number(bool));
	};

	Exps.prototype.isTagMuted = function(ret, tag)
	{
		let bool = taggedFiles[tag].instance.mute();
		ret.set_int(Number(bool));
	};

	Exps.prototype.getVolume = function(ret, tag)
	{
		let volume = taggedFiles[tag].instance.volume();
		ret.set_float(volume);
	};

	Exps.prototype.getRate = function(ret, tag)
	{
		let rate = taggedFiles[tag].instance.rate();
		ret.set_float(rate);
	};

	Exps.prototype.getCurrentTime = function(ret, tag){
		let currentTime = taggedFiles[tag].instance.seek();
		ret.set_float(currentTime);
	};

	Exps.prototype.getDuration = function(ret, tag){
		let duration = taggedFiles[tag].instance.duration();
		ret.set_float(duration);
	};

	Exps.prototype.getAmplitudeVolume = function(ret, tag)
	{
		let vol = taggedFiles[tag].amplitude.volume.volume;
		ret.set_float(vol);
	};

	Exps.prototype.getAmplitudeVolumeNorm = function(ret, tag)
	{
		let volNorm = taggedFiles[tag].amplitude.volume.volNorm;
		ret.set_float(volNorm);
	};

	Exps.prototype.getAmplitudeStereo = function(ret, channel, tag)
	{
		let stereoVol = taggedFiles[tag].amplitude.volume.stereoVol[channel];
		ret.set_float(stereoVol);
	};

	Exps.prototype.getAmplitudeStereoNorm = function(ret, channel, tag)
	{
		let stereoVolNorm = taggedFiles[tag].amplitude.volume.stereoVolNorm[channel];
		ret.set_float(stereoVolNorm);
	};

	Exps.prototype.getSmoothingForAmplitudeProcessor = function(ret, tag)
	{
		let smoothing = taggedFiles[tag].amplitude.smoothing;
		ret.set_float(smoothing);
	};

	Exps.prototype.isBeatDetected = function(ret, tag){
		let bool = taggedFiles[tag].beatDetection.beatDetected;
		ret.set_int(Number(bool));
	};

	Exps.prototype.getBeatHoldFrames = function(ret, tag){
		let beatHoldFrames = taggedFiles[tag].beatDetection.beatHoldFrames;
		ret.set_float(beatHoldFrames);
	};

	Exps.prototype.getBeatThreshold = function(ret, tag){
		let beatThreshold = taggedFiles[tag].beatDetection.beatThreshold;
		ret.set_float(beatThreshold);
	};

	Exps.prototype.getBeatCutoff = function(ret, tag){
		let beatCutoff = taggedFiles[tag].beatDetection.beatCutoff;
		ret.set_float(beatCutoff);
	};

	Exps.prototype.getBeatDecayRate = function(ret, tag){
		let beatDecayRate = taggedFiles[tag].beatDetection.beatDecayRate;
		ret.set_float(beatDecayRate);
	};

	Exps.prototype.getFramesSinceLastBeat = function(ret, tag){
		let framesSinceLastBeat = taggedFiles[tag].beatDetection.framesSinceLastBeat;
		ret.set_float(framesSinceLastBeat);
	};

	Exps.prototype.getLengthForPreprocessor = function(ret, tag){
		let length = taggedFiles[tag].preprocessor.getLength();
		ret.set_int(length);
	};

	Exps.prototype.getChannelCountForPreprocessor = function(ret, tag){
		let channels = taggedFiles[tag].preprocessor.getNumberOfChannels();
		ret.set_int(channels);
	};

	Exps.prototype.getSampleRateForPreprocessor = function(ret, tag){
		let sampleRate = taggedFiles[tag].preprocessor.getSampleRate();
		ret.set_int(sampleRate);
	};

	Exps.prototype.getBufferSizeForPreprocessor = function(ret, tag){
		let bufferSize = taggedFiles[tag].preprocessor.getBufferSize();
		ret.set_int(bufferSize);
	};

	Exps.prototype.getChannelData = function(ret, channel, seconds, tag){
		let lastData = taggedFiles[tag].preprocessor.getChannelDataFrom(channel, seconds);
		ret.set_string(lastData.join("|"));
	};

	Exps.prototype.getChannelDataSum = function(ret, channel, seconds, tag){
		let lastData = taggedFiles[tag].preprocessor.getChannelDataFrom(channel, seconds);
		let sum = lastData.reduce((a, b) => a + b, 0);
		ret.set_float(sum);
	};

	pluginProto.exps = new Exps();

}());