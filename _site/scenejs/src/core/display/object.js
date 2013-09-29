/**
 * @class An object within a {@link SceneJS_Display}
 * @private
 */
var SceneJS_Object = function(id) {

    /**
     * ID for this objects, unique among all objects in the display
     * @type Number
     */
    this.id = id;

    /**
     * Hash code for this object, unique among all objects in the display
     * @type String
     */
    this.hash = null;

    /**
     * State sort key, computed from {@link #layer}, {@link #program} and {@link #texture}
     * @type Number
     */
    this.sortKey = null;

    /**
     * Sequence of state chunks applied to render this object
     * @type {[SceneJS_Chunk]} chunks
     */
    this.chunks = [];

    /**
     * Number of state chunks applied to render this object
     * @type Number
     */
    this.chunksLen = 0;

    /**
     * Shader programs that render this object, also used for (re)computing {@link #sortKey}
     * @type SceneJS_Program
     */
    this.program = null;

    /**
     * State core for the {@link SceneJS.Layer} that this object was compiled from, used for (re)computing {@link #sortKey} and visibility cull
     */
    this.layer = null;

     /**
     * State core for the {@link SceneJS.Texture} that this object was compiled from, used for (re)computing {@link #sortKey}
     */
    this.texture = null;

    /**
     * State core for the {@link SceneJS.Flags} that this object was compiled from, used for visibility cull
     */
    this.flags = null;

    /**
     * State core for the {@link SceneJS.Tag} that this object was compiled from, used for visibility cull
     */
    this.tag = null;
};