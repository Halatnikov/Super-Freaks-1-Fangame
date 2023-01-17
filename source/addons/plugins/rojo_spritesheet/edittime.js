function GetPluginSettings()
{
	return {
		"name":			"Sprite sheet",				// as appears in 'insert object' dialog, can be changed as long as "id" stays the same
		"id":			"rojo_spritesheet",				// this is used to identify this plugin and is saved to the project; never change it
		"version":		"1.0",					// (float in x.y format) Plugin version - C2 shows compatibility warnings based on this
		"description":	"<appears at the bottom of the insert object dialog>",
		"author":		"R0J0hound",
		"help url":		"<your website or a manual entry on Scirra.com>",
		"category":		"General",				// Prefer to re-use existing categories, but you can set anything here
		"type":			"world",				// either "world" (appears in layout and is drawn), else "object"
		"rotatable":	true,					// only used when "type" is "world".  Enables an angle property on the object.
        //"defaultimage":	"default.png",
		"flags":		0						// uncomment lines to enable flags...
					//	| pf_singleglobal		// exists project-wide, e.g. mouse, keyboard.  "type" must be "object".
						| pf_texture			// object has a single texture (e.g. tiled background)
						| pf_position_aces		// compare/set/get x, y...
						| pf_size_aces			// compare/set/get width, height...
						| pf_angle_aces			// compare/set/get angle (recommended that "rotatable" be set to true)
						| pf_appearance_aces	// compare/set/get visible, opacity...
						| pf_tiling				// adjusts image editor features to better suit tiled images (e.g. tiled background)
					//	| pf_animations			// enables the animations system.  See 'Sprite' for usage
						| pf_zorder_aces		// move to top, bottom, layer...
					//  | pf_nosize				// prevent resizing in the editor
						| pf_effects			// allow WebGL shader effects to be added
					    | pf_predraw			// set for any plugin which draws and is not a sprite (i.e. does not simply draw
												// a single non-tiling image the size of the object) - required for effects to work properly
	};
};

////////////////////////////////////////
// Parameter types:
// AddNumberParam(label, description [, initial_string = "0"])			// a number
// AddStringParam(label, description [, initial_string = "\"\""])		// a string
// AddAnyTypeParam(label, description [, initial_string = "0"])			// accepts either a number or string
// AddCmpParam(label, description)										// combo with equal, not equal, less, etc.
// AddComboParamOption(text)											// (repeat before "AddComboParam" to add combo items)
// AddComboParam(label, description [, initial_selection = 0])			// a dropdown list parameter
// AddObjectParam(label, description)									// a button to click and pick an object type
// AddLayerParam(label, description)									// accepts either a layer number or name (string)
// AddLayoutParam(label, description)									// a dropdown list with all project layouts
// AddKeybParam(label, description)										// a button to click and press a key (returns a VK)
// AddAnimationParam(label, description)								// a string intended to specify an animation name
// AddAudioFileParam(label, description)								// a dropdown list with all imported project audio files

////////////////////////////////////////
// Conditions

// AddCondition(id,					// any positive integer to uniquely identify this condition
//				flags,				// (see docs) cf_none, cf_trigger, cf_fake_trigger, cf_static, cf_not_invertible,
//									// cf_deprecated, cf_incompatible_with_triggers, cf_looping
//				list_name,			// appears in event wizard list
//				category,			// category in event wizard list
//				display_str,		// as appears in event sheet - use {0}, {1} for parameters and also <b></b>, <i></i>
//				description,		// appears in event wizard dialog when selected
//				script_name);		// corresponding runtime function name
				
// example				
//AddNumberParam("Number", "Enter a number to test if positive.");

AddCondition(0, cf_trigger, "On image URL loaded", "Web", "On image URL loaded", "Triggered after 'Load image from URL' when the image has finished loading.", "OnURLLoaded");

////////////////////////////////////////
// Actions

// AddAction(id,				// any positive integer to uniquely identify this action
//			 flags,				// (see docs) af_none, af_deprecated
//			 list_name,			// appears in event wizard list
//			 category,			// category in event wizard list
//			 display_str,		// as appears in event sheet - use {0}, {1} for parameters and also <b></b>, <i></i>
//			 description,		// appears in event wizard dialog when selected
//			 script_name);		// corresponding runtime function name

// example
AddComboParamOption("Normal");
AddComboParamOption("Additive");
AddComboParamOption("XOR");
AddComboParamOption("Copy");
AddComboParamOption("Destination over");
AddComboParamOption("Source in");
AddComboParamOption("Destination in");
AddComboParamOption("Source out");
AddComboParamOption("Destination out");
AddComboParamOption("Source atop");
AddComboParamOption("Destination atop");
AddComboParam("Blend mode", "Choose the new blend mode for this object.");
AddAction(0, af_none, "Set blend mode", "Appearance", "Set blend mode to <i>{0}</i>", "Set the background blend mode for this object.", "SetEffect");

AddStringParam("URI", "Enter the URL on the web, or data URI, of an image to load.", "\"http://\"");
AddAction(1, af_none, "Load image from URL", "Web", "Load image from <i>{0}</i>", "Load an image from a web address or data URI.", "LoadURL");

AddNumberParam("offset x", "Image offset x, in pixels.");
AddNumberParam("offset y", "Image offset y, in pixels.");
AddNumberParam("sub width", "Width, in pixels.", "128");
AddNumberParam("sub height", "Height, in pixels.", "128");
AddAction(2, af_none, "Set sub-image offset and size", "Image", "Set sub-image offset to ({0},{1}) and size to ({2},{3})", "Set sub-image offset and size.", "SetSubImage");

////////////////////////////////////////
// Expressions

// AddExpression(id,			// any positive integer to uniquely identify this expression
//				 flags,			// (see docs) ef_none, ef_deprecated, ef_return_number, ef_return_string,
//								// ef_return_any, ef_variadic_parameters (one return flag must be specified)
//				 list_name,		// currently ignored, but set as if appeared in event wizard
//				 category,		// category in expressions panel
//				 exp_name,		// the expression name after the dot, e.g. "foo" for "myobject.foo" - also the runtime function name
//				 description);	// description in expressions panel

AddExpression(0, ef_return_number, "", "Image", "ImageWidth", "The width of the current image, in pixels.");
AddExpression(1, ef_return_number, "", "Image", "ImageHeight", "The height of the current image, in pixels.");
AddExpression(2, ef_return_number, "", "Sub-image", "offsetX", "The current x sub-image offset, in pixels.");
AddExpression(3, ef_return_number, "", "Sub-image", "offsetY", "The current y sub-image offset, in pixels.");
AddExpression(4, ef_return_number, "", "Sub-image", "SubWidth", "The current sub-image width, in pixels.");
AddExpression(5, ef_return_number, "", "Sub-image", "SubHeight", "The current sub-image height, in pixels.");

////////////////////////////////////////
ACESDone();

////////////////////////////////////////
// Array of property grid properties for this plugin
// new cr.Property(ept_integer,		name,	initial_value,	description)		// an integer value
// new cr.Property(ept_float,		name,	initial_value,	description)		// a float value
// new cr.Property(ept_text,		name,	initial_value,	description)		// a string
// new cr.Property(ept_color,		name,	initial_value,	description)		// a color dropdown
// new cr.Property(ept_font,		name,	"Arial,-16", 	description)		// a font with the given face name and size
// new cr.Property(ept_combo,		name,	"Item 1",		description, "Item 1|Item 2|Item 3")	// a dropdown list (initial_value is string of initially selected item)
// new cr.Property(ept_link,		name,	link_text,		description, "firstonly")		// has no associated value; simply calls "OnPropertyChanged" on click

var property_list = [
    new cr.Property(ept_link,	"Image",				"Edit", "Click to edit the object's image.", "firstonly"),
	new cr.Property(ept_combo,	"Initial visibility",	"Visible",	"Choose whether the object is visible when the layout starts.", "Visible|Invisible"),
	new cr.Property(ept_combo,	"Hotspot",				"Top-left",	"Choose the location of the hot spot in the object.", "Top-left|Top|Top-right|Left|Center|Right|Bottom-left|Bottom|Bottom-right"),
	new cr.Property(ept_integer, 	"offset x",		0,		"Sub-image offset x."),
    new cr.Property(ept_integer, 	"offset y",		0,		"Sub-image offset x."),
    new cr.Property(ept_integer, 	"sub width",		256,		"Sub-image width."),
    new cr.Property(ept_integer, 	"sub height",		256,		"Sub-image height.")
	];
	
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
	return new IDEInstance(instance);
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
		
	// Plugin-specific variables
    this.just_inserted = false;
	this.offsetx = 0;
    this.offsety = 0;
    this.subwidth= 256;
    this.subheight=256;
}

IDEInstance.prototype.OnCreate = function()
{
    switch (this.properties["Hotspot"])
	{
    case "Top-left" :
      this.instance.SetHotspot(new cr.vector2(0, 0));
      break;
    case "Top" :
      this.instance.SetHotspot(new cr.vector2(0.5, 0));
      break;
    case "Top-right" :
      this.instance.SetHotspot(new cr.vector2(1, 0));
      break;
    case "Left" :
      this.instance.SetHotspot(new cr.vector2(0, 0.5));
      break;
    case "Center" :
      this.instance.SetHotspot(new cr.vector2(0.5, 0.5));
      break;
    case "Right" :
      this.instance.SetHotspot(new cr.vector2(1, 0.5));
      break;
    case "Bottom-left" :
      this.instance.SetHotspot(new cr.vector2(0, 1));
      break;
    case "Bottom" :
      this.instance.SetHotspot(new cr.vector2(0.5, 1));
      break;
    case "Bottom-right" :
		  this.instance.SetHotspot(new cr.vector2(1, 1));
      break;
	}
}

// Called when inserted via Insert Object Dialog for the first time
IDEInstance.prototype.OnInserted = function()
{
    this.just_inserted = true;
}

// Called when double clicked in layout
IDEInstance.prototype.OnDoubleClicked = function()
{
    this.instance.EditTexture();
}

// Called after a property has been changed in the properties bar
IDEInstance.prototype.OnPropertyChanged = function(property_name)
{
    if (property_name === "Image")
	{
		this.instance.EditTexture();
	}
    else if (property_name === "offset x")
    {
        this.offsetx = this.properties["offset x"]
    }
    else if (property_name === "offset y")
    {
        this.offsety = this.properties["offset y"]
    }
    else if (property_name === "sub width")
    {
        this.subwidth = this.properties["sub width"]
    }
    else if (property_name === "sub height")
    {
        this.subheight = this.properties["sub height"]
    }
	else if (property_name === "Hotspot")
	{
        switch (this.properties["Hotspot"])
        {
        case "Top-left" :
          this.instance.SetHotspot(new cr.vector2(0, 0));
          break;
        case "Top" :
          this.instance.SetHotspot(new cr.vector2(0.5, 0));
          break;
        case "Top-right" :
          this.instance.SetHotspot(new cr.vector2(1, 0));
          break;
        case "Left" :
          this.instance.SetHotspot(new cr.vector2(0, 0.5));
          break;
        case "Center" :
          this.instance.SetHotspot(new cr.vector2(0.5, 0.5));
          break;
        case "Right" :
          this.instance.SetHotspot(new cr.vector2(1, 0.5));
          break;
        case "Bottom-left" :
          this.instance.SetHotspot(new cr.vector2(0, 1));
          break;
        case "Bottom" :
          this.instance.SetHotspot(new cr.vector2(0.5, 1));
          break;
        case "Bottom-right" :
              this.instance.SetHotspot(new cr.vector2(1, 1));
          break;
        }
    }
}

// For rendered objects to load fonts or textures
IDEInstance.prototype.OnRendererInit = function(renderer)
{
    renderer.LoadTexture(this.instance.GetTexture());
}

// Called to draw self in the editor if a layout object
IDEInstance.prototype.Draw = function(renderer)
{
    var texture = this.instance.GetTexture();
	renderer.SetTexture(this.instance.GetTexture());
    
    if (this.just_inserted)
	{
		this.just_inserted = false;
		var sz = texture.GetImageSize();
		//this.instance.SetSize(new cr.vector2(256,256));
        this.subwidth = sz.x;
        this.subheight = sz.y;
		//RefreshPropertyGrid();		// show new size
	}
    
    var texsize = texture.GetImageSize();
	var uv = new cr.rect(this.offsetx/texsize.x, this.offsety/texsize.y, (this.offsetx+this.subwidth)/texsize.x, (this.offsety+this.subheight)/texsize.y);
	renderer.Quad(this.instance.GetBoundingQuad(), this.instance.GetOpacity(), uv);
}

// For rendered objects to release fonts or textures
IDEInstance.prototype.OnRendererReleased = function(renderer)
{
    renderer.ReleaseTexture(this.instance.GetTexture());
}