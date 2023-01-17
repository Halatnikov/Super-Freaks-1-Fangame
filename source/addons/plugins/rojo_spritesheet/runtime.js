// ECMAScript 5 strict mode
"use strict";

assert2(cr, "cr namespace not created");
assert2(cr.plugins_, "cr.plugins_ not created");

/////////////////////////////////////
// Plugin class
// *** CHANGE THE PLUGIN ID HERE *** - must match the "id" property in edittime.js
//          vvvvvvvv
cr.plugins_.rojo_spritesheet = function(runtime)
{
	this.runtime = runtime;
};

(function ()
{
	/////////////////////////////////////
	// *** CHANGE THE PLUGIN ID HERE *** - must match the "id" property in edittime.js
	//                            vvvvvvvv
	var pluginProto = cr.plugins_.rojo_spritesheet.prototype;
		
	/////////////////////////////////////
	// Object type class
	pluginProto.Type = function(plugin)
	{
		this.plugin = plugin;
		this.runtime = plugin.runtime;
	};

	var typeProto = pluginProto.Type.prototype;

	// called on startup for each object type
	typeProto.onCreate = function()
	{
        if (this.is_family)
			return;
		
		// Create the texture
		this.texture_img = new Image();
		this.texture_img["idtkLoadDisposed"] = true;
		this.texture_img.src = this.texture_file;
		this.texture_img.cr_filesize = this.texture_filesize;
		
		// Tell runtime to wait for this to load
		this.runtime.wait_for_textures.push(this.texture_img);
        
		this.webGL_texture = null;
	};
    
    typeProto.onLostWebGLContext = function ()
	{
		if (this.is_family)
			return;
			
		this.webGL_texture = null;
	};
	
	typeProto.onRestoreWebGLContext = function ()
	{
		// No need to create textures if no instances exist, will create on demand
		if (this.is_family || !this.instances.length)
			return;
		
		if (!this.webGL_texture)
		{
			this.webGL_texture = this.runtime.glwrap.loadTexture(this.texture_img, true, this.runtime.linearSampling, this.texture_pixelformat);
		}
		
		var i, len;
		for (i = 0, len = this.instances.length; i < len; i++)
			this.instances[i].webGL_texture = this.webGL_texture;
	};
	
	typeProto.loadTextures = function ()
	{
		if (this.is_family || this.webGL_texture || !this.runtime.glwrap)
			return;
			
		this.webGL_texture = this.runtime.glwrap.loadTexture(this.texture_img, true, this.runtime.linearSampling, this.texture_pixelformat);
	};
	
	typeProto.unloadTextures = function ()
	{
		// Don't release textures if any instances still exist, they are probably using them
		if (this.is_family || this.instances.length || !this.webGL_texture)
			return;
		
		this.runtime.glwrap.deleteTexture(this.webGL_texture);
		this.webGL_texture = null;
	};
	
	typeProto.preloadCanvas2D = function (ctx)
	{
		// draw to preload, browser should lazy load the texture
		ctx.drawImage(this.texture_img, 0, 0);
	};

	/////////////////////////////////////
	// Instance class
	pluginProto.Instance = function(type)
	{
		this.type = type;
		this.runtime = type.runtime;
		
		// any other properties you need, e.g...
		// this.myValue = 0;
	};
	
	var instanceProto = pluginProto.Instance.prototype;

	// called whenever an instance is created
	instanceProto.onCreate = function()
	{
		// note the object is sealed after this call; ensure any properties you'll ever need are set on the object
		this.visible = (this.properties[0] === 0);							// 0=visible, 1=invisible
		this.rcTex = new cr.rect(0, 0, 0, 0);
				
		if (this.runtime.glwrap)
		{
			// Create WebGL texture if type doesn't have it yet
			this.type.loadTextures();
		}
		        
        this.offsetx = this.properties[2];
        this.offsety = this.properties[3];
        this.subwidth = this.properties[4];
        this.subheight = this.properties[5];
	};
	
	// called whenever an instance is destroyed
	// note the runtime may keep the object after this call for recycling; be sure
	// to release/recycle/reset any references to other objects in this function.
	instanceProto.onDestroy = function ()
	{
	};
	
	// called when saving the full state of the game
	instanceProto.saveToJSON = function ()
	{
		// return a Javascript object containing information about your object's state
		// note you MUST use double-quote syntax (e.g. "property": value) to prevent
		// Closure Compiler renaming and breaking the save format
		return {
			// e.g.
			//"myValue": this.myValue
            "offset x": this.offsetx,
            "offset y": this.offsety,
            "sub width": this.subwidth,
            "sub height": this.subheight
		};
	};
	
	// called when loading the full state of the game
	instanceProto.loadFromJSON = function (o)
	{
		// load from the state previously saved by saveToJSON
		// 'o' provides the same object that you saved, e.g.
		// this.myValue = o["myValue"];
		// note you MUST use double-quote syntax (e.g. o["property"]) to prevent
		// Closure Compiler renaming and breaking the save format
        this.offsetx = o["offset x"];
        this.offsety = o["offset y"];
        this.subwidth = o["sub width"];
        this.subheight = o["sub height"];
	};
	
	// only called if a layout object - draw to a canvas 2D context
	instanceProto.draw = function(ctx)
	{
        ctx.save();
		
		ctx.globalAlpha = this.opacity;
		ctx.globalCompositeOperation = this.compositeOp;
		
		var myx = this.x;
		var myy = this.y;
		if (this.runtime.pixel_rounding)
		{
			myx = Math.round(myx);
			myy = Math.round(myy);
		}
		
		ctx.translate(myx, myy);
		
        var w = this.width;
		var h = this.height;
		var widthfactor = w > 0 ? 1 : -1;
		var heightfactor = h > 0 ? 1 : -1;
        if (widthfactor !== 1 || heightfactor !== 1)
        {
				ctx.scale(widthfactor, heightfactor);
                w=cr.abs(w);
                h=cr.abs(h);
        }
                
        ctx.rotate(this.angle);
		ctx.drawImage(this.type.texture_img,
                          this.offsetx,
                          this.offsety,
                          this.subwidth,
                          this.subheight,
						  0 - (this.hotspotX * w),
						  0 - (this.hotspotY * h),
						  w,
						  h);
		
		ctx.restore();
	};
	
	// only called if a layout object in WebGL mode - draw to the WebGL context
	// 'glw' is not a WebGL context, it's a wrapper - you can find its methods in GLWrap.js in the install
	// directory or just copy what other plugins do.
	instanceProto.drawGL = function (glw)
	{
        var img = this.type.texture_img;
        glw.setTexture(this.type.webGL_texture);
		glw.setOpacity(this.opacity);

        var rcTex = this.rcTex;
        rcTex.left = this.offsetx/img.width;
        rcTex.top = this.offsety/img.height;
		rcTex.right = (this.offsetx+this.subwidth) / img.width;
		rcTex.bottom = (this.offsety+this.subheight) / img.height;
        
		var q = this.bquad;
		
		if (this.runtime.pixel_rounding)
		{
			var ox = Math.round(this.x) - this.x;
			var oy = Math.round(this.y) - this.y;
			
			glw.quadTex(q.tlx + ox, q.tly + oy, q.trx + ox, q.try_ + oy, q.brx + ox, q.bry + oy, q.blx + ox, q.bly + oy, rcTex);
		}
		else
			glw.quadTex(q.tlx, q.tly, q.trx, q.try_, q.brx, q.bry, q.blx, q.bly, rcTex);
	};
	
	// The comments around these functions ensure they are removed when exporting, since the
	// debugger code is no longer relevant after publishing.
	/**BEGIN-PREVIEWONLY**/
	instanceProto.getDebuggerValues = function (propsections)
	{
		// Append to propsections any debugger sections you want to appear.
		// Each section is an object with two members: "title" and "properties".
		// "properties" is an array of individual debugger properties to display
		// with their name and value, and some other optional settings.
		propsections.push({
			"title": "My debugger section",
			"properties": [
				// Each property entry can use the following values:
				// "name" (required): name of the property (must be unique within this section)
				// "value" (required): a boolean, number or string for the value
				// "html" (optional, default false): set to true to interpret the name and value
				//									 as HTML strings rather than simple plain text
				// "readonly" (optional, default false): set to true to disable editing the property
				
				// Example:
				// {"name": "My property", "value": this.myValue}
			]
		});
	};
	
	instanceProto.onDebugValueEdited = function (header, name, value)
	{
		// Called when a non-readonly property has been edited in the debugger. Usually you only
		// will need 'name' (the property name) and 'value', but you can also use 'header' (the
		// header title for the section) to distinguish properties with the same name.
		if (name === "My property")
			this.myProperty = value;
	};
	/**END-PREVIEWONLY**/

	//////////////////////////////////////
	// Conditions
	function Cnds() {};

	// the example condition
	Cnds.prototype.OnURLLoaded = function ()
	{
		return true;
	};
	
	// ... other conditions here ...
	
	pluginProto.cnds = new Cnds();
	
	//////////////////////////////////////
	// Actions
	function Acts() {};

	// the example action
	Acts.prototype.SetEffect = function (effect)
	{	
		this.compositeOp = cr.effectToCompositeOp(effect);
		cr.setGLBlend(this, effect, this.runtime.gl);
		this.runtime.redraw = true;
	};
	
	Acts.prototype.LoadURL = function (url_)
	{
		var img = new Image();
		var self = this;
		
		img.onload = function ()
		{
            //only change if different
            if (self.type.texture_img.src === img.src)
                return;
			self.type.texture_img = img;
			
			// WebGL renderer
			if (self.runtime.glwrap)
			{
				// Delete any previous own texture
				if (self.type.webGL_texture)
					self.runtime.glwrap.deleteTexture(self.type.webGL_texture);
					
				self.type.webGL_texture = self.runtime.glwrap.loadTexture(img, true, self.runtime.linearSampling);
                //self.type.updateAllCurrentTexture();
			}
			
			self.runtime.redraw = true;
			self.runtime.trigger(cr.plugins_.rojo_spritesheet.prototype.cnds.OnURLLoaded, self);
		};
		
		if (url_.substr(0, 5) !== "data:")
			img.crossOrigin = 'anonymous';
        
        //early only change if different
		if (this.type.texture_img.src === url_)
                return;
		img.src = url_;
	};
	
	Acts.prototype.SetSubImage = function (offx, offy, subwidth, subheight)
    {
        this.offsetx = offx;
        this.offsety = offy;
        this.subwidth = subwidth;
        this.subheight = subheight;
		this.runtime.redraw = true;
    };	
    
	pluginProto.acts = new Acts();
	
	//////////////////////////////////////
	// Expressions
	function Exps() {};
	
	Exps.prototype.ImageWidth = function (ret)
	{
		ret.set_float(this.texture_img.width);
	};
	
	Exps.prototype.ImageHeight = function (ret)
	{
		ret.set_float(this.texture_img.height);
	};
    
	Exps.prototype.offsetX = function (ret)	
	{
		ret.set_float(this.offsetx);
	};
    
    Exps.prototype.offsetY = function (ret)	
	{
		ret.set_float(this.offsety);
	};
    
    Exps.prototype.SubWidth = function (ret)	
	{
		ret.set_float(this.subwidth);
	};
    
    Exps.prototype.SubHeight = function (ret)	
	{
		ret.set_float(this.subheight);
	};
	
	// ... other expressions here ...
	
	pluginProto.exps = new Exps();

}());