---
layout: post
title: Creating Node Types for SceneJS
description: "How to create new types of scene node"
modified: 2013-05-31
category: articles
tags: [tutorial, extending, plugins]
---

<section id="table-of-contents" class="toc">
  <header>
    <h3>Contents</h3>
  </header>
<div id="drawer" markdown="1">
*  Auto generated table of contents
{:toc}
</div>
</section><!-- /#table-of-contents -->


New node types may provided for SceneJS via plugins. This is a powerful extension mechanism which
allows you to create your own high-level scene components that just slot straight into your scene graphs as nodes which
you can create and update as usual via the JSON API.

In this section we'll see how to provide a node type, and how to use the node type within a scene graph.

The examples page also has [several examples](http://scenejs.org/examples.html?tags=customNodes) that show how to define
and use node types.

# Creating a New Node Type

A class definition for a node type is provided to SceneJS as plugin script, which it will dynamically load on-demand
the first time you try to instantiate it within your scene graph.

As shown in the trivial example below, custom nodes often work as facades that can create additional nodes within their
subgraphs, while providing accessor methods which usually get or set state on those nodes:

{% highlight javascript %}
SceneJS.Types.addType("demos/color", {

    // Constructor
    // The params are the attributes which are specified
    // for instances of this node type within scene definitions
    init:function (params) {

        this._material = this.addNode({
            type:"material",

            // Custom node types are responsible for
            // attaching any child nodes that are
            // specified in their 'nodes' properties
            nodes:params.nodes
        });

        // Set initial color, if provided
        if (params.color) {
            this.setColor(params.color);
        }
    },

    // Setter on node to set its color
    setColor:function (color) {
        this._material.setColor(color);
    },

    // Getter on node to get its color
    getColor:function () {
        return this._material.getColor();
    },

    // Node destructor, not actually needed for this
    // example. Use these to clean up any resources
    // created by the node.
    //
    // Note that when the node is destroyed, SceneJS
    // will automatically destroy any child nodes
    // of our node, so there's no need to destroy them
    // manually with a destructor.
    destroy:function () {
    }
});
{% endhighlight %}

This plugin happens to be deployed within the SceneJS plugins directory in this repo, at this location:

[http://scenejs.org/api/latest/plugins/node/demos/color.js](http://scenejs.org/api/latest/plugins/node/demos/color.js)

Note that the plugin script installs the new node type as "demos/color", and see how that type name maps to the
script's location within the ```http://scenejs.org/api/latest/plugins/node``` directory.

# Using a New Node Type

Let's assume that we've configured SceneJS to find our plugin (this is the default configuration by the way, so don't
bother doing this if you're hotlinking to the SceneJS lib and just want to use the plugins from this repo):

{% highlight javascript %}
SceneJS.configure({
    pluginPath: "http://scenejs.org/api/latest/plugins"
});
{% endhighlight %}

Now we can create a scene that includes an instance of our new node type.

{% highlight javascript %}
var scene = SceneJS.createScene({
    nodes:[
        {
            type:"lookAt",
            eye:{ x:8, y:8, z:8 },

            nodes:[

                // Node type defined by plugin
                // http://scenejs.org/api/latest/plugins/node/demos/color.js
                {
                    type:"demos/color",
                    id: "myColor",
                    color: { r: 1, g: 0.3, b: 0.3 },

                    // Child nodes specified for custom nodes are
                    // expected to be created within the custom
                    // types' constructors (see this in the custom
                    // node type's constructor above)
                    nodes:[

                        // Geometry using a plugin loaded from
                        // /geometry/teapot
                        {
                            type:"geometry",
                            source:{
                                type:"teapot"
                            }
                        }
                    ]
                }
            ]
        }
    ]
});
{% endhighlight %}

When SceneJS parses that instance of our ```demos/color``` node type, it's going to dynamically load our plugin script,
which will install the plugin type, which SceneJS will then instantiate to create the node.

See how in the scene we are providing a child geometry for our node. Within its constructor (the ```init``` method in
the node type definition plugin above) the custom node type is responsible for inserting  specified child node(s) into
the subgraph it creates under itself. That's because only the node type knows exactly where the child nodes should be located within its subgraph.

Now lets get the node instance and use one of its accessor methods to periodically switch its color property.

Note that since our node originates from a plugin that will be loaded on-demand, we need to get the node asynchronously
using a callback (instead of synchronously, like we can with instances of core node types):

{% highlight javascript %}
    scene.getNode("myColor",
        function(myColor) {

            setInterval(function() {

                myColor.setColor({
                    r: Math.random(),
                    g: Math.random(),
                    b: Math.random()
                });
            }, 1000);
        });
{% endhighlight %}

See that setColor method, which is defined by our node type?

[Run this example](http://scenejs.org/examples.html?page=customBundledNodeColor)

# Using 3rd-Party Libraries in Nodes

SceneJS bundles RequireJS, so that plugins can dynamically load support libraries, such as those from 3rd-party vendors.

Support libraries used by custom node types are kept in a [lib directory inside the plugins directory](https://github.com/xeolabs/scenejs/tree/V3.1/api/latest/plugins/lib).

Custom node types can then require the dependencies using a *scenejsPluginDeps* prefix:

{% highlight javascript %}
    require([

        // This prefix routes to the 3rd-party libs directory
        // containing resources used by plugins
        "scenejsPluginDeps/someLibrary.js"
    ],
        function () {

            SceneJS.Types.addType("foo/myCustomNodeType", {

                init: function (params) {
                    // Now we can use that library in our node
                    // ...
                }
            });
        });
{% endhighlight %}

SceneJS synchronises that RequireJS ```scenejsPluginDeps``` path with the current [pluginPath configuration](#serving-plugins-yourself).

As an example, the bundled [canvas/capture](https://github.com/xeolabs/scenejs/blob/V3.1/api/latest/plugins/node/canvas/capture.js) node type
uses the 3rd-party ```canvas2image``` library to capture the canvas to an image. Run a demo of that node
[here](http://scenejs.org/examples.html?page=canvasCapture).

# Publishing Data from Nodes

Sometimes we want our nodes to publish some data that we can subscribe to via the API.

Here's a ```growingTeapot``` node, which grows in height along the Y-axis, then publishes its height when it reaches a certain value:

{% highlight javascript %}
SceneJS.Types.addType("growingTeapot", {

    // Node constructor.
    init:function (params) {

        // Our node will contain a teapot that grows in height on the Y-axis
        var scale = this.addNode({
            type:"scale",
            x:1,
            y:0,
            z:1,
            nodes:[

                // Green material
                {
                    type:"material",
                    color:{ r:0.6, g:0.6, b:1.0 },
                    nodes:[

                // Teapot primitive,
                // implemented by plugin at
                // http://scenejs.org/api/latest/plugins/node/prims/teapot.js
                        {
                            type:"prims/teapot"
                        }
                    ]
                }
            ]
        });

        // Start growing the teapot within the scene animation loop
        var ySize = 0;
        var self = this;
        this._tick = this.getScene().on("tick",
            function () {

                if (ySize >= 1) {
                    self.publish("teapotGrown", {
                       newHeight:ySize
                    });

                    // Unsubscribe from scene render loop
                    self.getScene().off(self._tick);
                    return;
                }

                scale.setY(ySize += 0.01);
            });
    },

    /**
     * Node destructor, unsubscribes from scene tick
     */
    destroy:function () {
        this.getScene().off(this._tick);
    }
});
{% endhighlight %}

We'll create a scene graph containing this node:

{% highlight javascript %}
// Create a scene that contains an instance of our node type
var scene = SceneJS.createScene({
    nodes:[

        // Mouse-orbited camera, implemented by plugin at
        // http://scenejs.org/api/latest/plugins/node/cameras/orbit.js
        {
            type:"cameras/orbit",
            yaw:30,
            pitch:-30,
            zoom:10,
            zoomSensitivity:5,
            nodes:[

                // An instance of our node type
                {
                    type:"growingTeapot",
                    id:"myGrowingTeapot"
                }
            ]
        }
    ]
});
{% endhighlight %}

Then we'll get that node and subscribe to its publication:

{% highlight javascript %}
// Get the custom node
scene.getNode("myGrowingTeapot",

    function (myGrowingTeapot) {

        // Subscribe to its publication topic
        myGrowingTeapot.on("teapotGrown",

            function (data) {

                // Show the publication in an alert
                alert(JSON.stringify(data));
            });
    });
{% endhighlight %}

[Run this example](http://scenejs.org/examples.html?page=customNodeDefWithPublications)

# Task Tracking on Nodes

Sometimes our nodes will run tasks that we'll want to monitor progress on.

Here's a defintion for that growing teapot node again, this time using ```taskStarted```, ```taskFinished```
and ```taskFailed```  methods to notify SceneJS of its progress while it grows. SceneJS can relay those
notifications to us as a count of tasks in progress, as we'll see further down.

{% highlight javascript %}
SceneJS.Types.addType("myGrowingTeapot", {

    // Node constructor.
    init: function (params) {

        // Our node will contain a teapot that grows in height on the Y-axis
        var scale = this.addNode({
            type: "scale",
            x: 1,
            y: 0,
            z: 1,
            nodes: [

                // Green material
                {
                    type: "material",
                    color: {
                        r: 0.6,
                        g: 0.6,
                        b: 1.0
                    },
                    nodes: [

               // Teapot primitive,
               // implemented by plugin at
               // http://scenejs.org/api/latest/plugins/node/prims/teapot.js
                        {
                            type: "prims/teapot"
                        }
                    ]
                }
            ]
        });

        // Notify that our node is starting its task
        this._taskId = this.taskStarted("Teapot growing");

        // Start growing the teapot within the scene animation loop
        var ySize = 0;
        var self = this;
        this._tick = this.getScene().on("tick",

            function () {

                if (ySize >= 1) {

                    // Notify that task has completed
                    self._taskId = self.taskFinished(self._taskId);

                    // Unsubscribe from scene render loop
                    self.getScene().off(self._tick);

                    return;
                }

                scale.setY(ySize += 0.002);
            });

        //----------------------------------------------------------------
        // If the task were to fail (not relevant to this example),
        // we would notify of failure as shown in the commented-out
        // line below - uncomment that to see what happens when you
        // notify of task failure.
        //----------------------------------------------------------------

        // this._taskId = this.taskFailed(this._taskId);
    },

    /**
     * Node destructor, unsubscribes from scene tick
     * Aborts task if still running, ie. where the node
     * is destroyed while the task is in process
     */
    destroy: function () {
        this.getScene().off(this._tick);
        if (this._taskId != null) {
            this._taskId = this.taskFinished(this._taskId);
        }
    }
});
{% endhighlight %}

Now create a scene that contains an instance of our node type:

{% highlight javascript %}
var scene = SceneJS.createScene({
    nodes: [

        // Mouse-orbited camera, implemented by plugin at
        // http://scenejs.org/api/latest/plugins/node/cameras/orbit.js
        {
            type: "cameras/orbit",
            yaw: 30,
            pitch: -30,
            zoom: 10,
            zoomSensitivity: 5,
            nodes: [

                // An instance of our node type
                {
                    type: "myGrowingTeapot"
                }
            ]
        }
    ]
});
{% endhighlight %}

Periodically query and log scene busyness status to the console:

{% highlight javascript %}
setInterval(function () {
    var status = scene.getStatus();
    if (!status) {
        console.log("Scene status not found");
        return;
    }
    if (status.destroyed) {
        console.log("Scene destroyed");
        return;
    }
    console.log("Scene tasks in progress: " + status.numTasks);
}, 100);
{% endhighlight %}

[Run this example](http://scenejs.org/examples.html?page=customNodeDefWithTasks)

# Scene Compilation Hooks

TODO