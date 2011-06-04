jQuery(function(){

provides('main');

var sceneGraph;

var GRID_RESOLUTION = 1024,
    GRID_SIZE = 512,
    FAR_AWAY = 10000,
    scene = requires('scene'),
    mesh = requires('mesh'),
    Loader = requires('loader').Loader,
    ShaderManager = requires('shader').Manager,
    glUtils = requires('glUtils'),
    uniform = requires('uniform'),
    Clock = requires('clock').Clock,
    MouseController = requires('cameracontroller').MouseController,
    InputHandler = requires('input').Handler,
    canvas = document.getElementById('c'),
    clock = new Clock(),
    input = new InputHandler(canvas),
    loader = new Loader(),
    resources = loader.resources,
    shaderManager = new ShaderManager(resources),
    controller;

function prepareScene(){
    sceneGraph = new scene.Graph();

    var vbo = new glUtils.VBO(mesh.grid(GRID_RESOLUTION)),
        heightmapTexture = new glUtils.Texture2D(resources['gfx/heightmap.png']),
        mountainShader = shaderManager.get('heightmap.vertex', 'terrain.frag'),
        waterShader = shaderManager.get('transform.vertex', 'color.frag'),
        transform, waterTransform;
        
    var camera = new scene.Camera([
        new scene.Uniforms({
            skyColor: new uniform.Vec3([0.1, 0.15, 0.45]),
            // looks sexy for some reason
            groundColor: new uniform.Vec3([-0.025, -0.05, -0.1]),
            sunColor: new uniform.Vec3([0.7*2, 0.6*2, 0.75*2]),
            sunDirection: new uniform.Vec3([0.577, 0.577, 0.577])
        }, [
            new scene.Material(mountainShader, {
                heightmap: heightmapTexture
            }, [
                transform = new scene.Transform([
                    new scene.SimpleMesh(vbo)
                ])
            ]),
            new scene.Material(waterShader,{
                color: new uniform.Vec3([0, 0, 1])
            }, [
                waterTransform = new scene.Transform([
                    new scene.SimpleMesh(vbo)
                ])
            ])
        ])
    ]);


    var fbo = new glUtils.FBO(2048, 2048, gl.FLOAT),
        mountainTarget = new scene.RenderTarget(fbo, [camera]);
        postprocess = new scene.Postprocess(shaderManager.get('screen.vertex', 'tonemapping.frag'), {
            texture: fbo,
        });

    camera.position[1] = 30;

    mat4.scale(transform.matrix, [1, 1, 1]);
    mat4.translate(transform.matrix, [-0.5*GRID_SIZE, -50, -0.5*GRID_SIZE]);
    mat4.scale(transform.matrix, [GRID_SIZE, 100, GRID_SIZE]);


    mat4.translate(waterTransform.matrix, [-FAR_AWAY, 0, -FAR_AWAY]);
    mat4.scale(waterTransform.matrix, [FAR_AWAY*2, 100, FAR_AWAY*2]);

    sceneGraph.root.append(mountainTarget);
    sceneGraph.root.append(postprocess);

    gl.clearColor(0.4, 0.6, 1.0, FAR_AWAY);

    controller = new MouseController(input, camera);
}

loader.onready = function() {
    console.log('loaded');
    glUtils.getContext(canvas, true);
    prepareScene();
    glUtils.fullscreen(canvas, sceneGraph);
    clock.start();
}
loader.load([
    'shaders/transform.vertex',
    'shaders/heightmap.vertex',
    'shaders/color.frag',
    'shaders/terrain.frag',

    'shaders/screen.frag',
    'shaders/tonemapping.frag',
    'shaders/screen.vertex',

    'shaders/hemisphere.glsl',
    'shaders/transform.glsl',
    'shaders/sun.glsl',

    'gfx/heightmap.png'
]);

clock.ontick = function(td) {
    sceneGraph.draw();
    controller.tick();
};

});
