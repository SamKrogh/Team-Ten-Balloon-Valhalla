/*
 * File: MazeLevel.js 
 * This is the logic of our game. 
 */

/*jslint node: true, vars: true */
/*global gEngine, Scene, GameObjectset, TextureObject, Camera, vec2,
  FontRenderable, SpriteRenderable, LineRenderable,
  GameObject */
/* find out more about jslint: http://www.jslint.com/help.html */

"use strict";  // Operate in Strict mode such that variables must be declared before used!

function MazeLevel() {
    this.kBalloonTex = "assets/balloon_lres.png";
    this.kSpikeTex = "assets/spike_lres.png";
    this.kGateTex = "assets/gate.png";
    this.kKeyTex = "assets/key.png";
    this.kMazePixels = "assets/maze_pixels.png";
    this.kMazeWalls = "assets/maze_clouds.png";
    this.kSkyTex = "assets/sky.png";
    
    this.kWinHeight = 90; // height balloons must reach to win
    
    // The camera to view the scene
    this.mLeftCamera = null;
    this.mRightCamera = null;
    this.mMapCamera = null;
    
    this.mLeftBalloon = null;
    this.mRightBalloon = null;
    
    this.mLabels = null;
    
    this.mSky = null;
    this.world = null;
    
    this.mTargetAngle = 0;
    this.mSmoothAngle = null;
    
    this.mNextState = "Lose";
}
gEngine.Core.inheritPrototype(MazeLevel, Scene);


MazeLevel.prototype.loadScene = function () {
    gEngine.Textures.loadTexture(this.kBalloonTex);
    gEngine.Textures.loadTexture(this.kSpikeTex);
    gEngine.Textures.loadTexture(this.kMazePixels);
    gEngine.Textures.loadTexture(this.kMazeWalls);
    gEngine.Textures.loadTexture(this.kGateTex);
    gEngine.Textures.loadTexture(this.kKeyTex);
    gEngine.Textures.loadTexture(this.kSkyTex);
};

MazeLevel.prototype.unloadScene = function () {
    gEngine.Textures.unloadTexture(this.kBalloonTex);
    gEngine.Textures.unloadTexture(this.kSpikeTex);
    gEngine.Textures.unloadTexture(this.kMazePixels);
    gEngine.Textures.unloadTexture(this.kMazeWalls);
    gEngine.Textures.unloadTexture(this.kGateTex);
    gEngine.Textures.unloadTexture(this.kKeyTex);
    gEngine.Textures.unloadTexture(this.kSkyTex);
    
    if (this.mNextState === "Win") {
        alert("You win!");
    }
    if (this.mNextState === "Lose") {
        alert("Balloon has popped!");
    }
    gEngine.Core.startScene(new MazeLevel());
};

MazeLevel.prototype.initialize = function () {
    
    // Step A: set up the cameras
    this.mLeftCamera = new Camera(
        vec2.fromValues(50, 40), // position of the camera
        50,                     // width of camera
        [0, 0, 400, 600]         // viewport (orgX, orgY, width, height)
    );
    this.mLeftCamera.setBackgroundColor([1, 0.8, 0.8, 1]);
    
    this.mRightCamera = new Camera(
        vec2.fromValues(50, 40), // position of the camera
        50,                     // width of camera
        [400, 0, 400, 600]         // viewport (orgX, orgY, width, height)
    );
    this.mRightCamera.setBackgroundColor([0.8, 1, 0.8, 1]);
    
    this.mMapCamera = new Camera(
        vec2.fromValues(0, 0), // position of the camera
        150,                     // width of camera
        [150, 50, 450, 500]         // viewport (orgX, orgY, width, height)
    );
    this.mMapCamera.setBackgroundColor([0.8, 0.8, 1, 1]);
    
    this.mSmoothAngle = new Interpolate(0, 60, 0.1);
    
    // sets the background to gray
    gEngine.DefaultResources.setGlobalAmbientIntensity(3);
    this.world = new Maze(this.kMazePixels, this.kMazeWalls, this.kSpikeTex, this.kGateTex, this.kKeyTex, 0,0,100,100,.3,.7,false); 
    
    this.mLeftBalloon = new Balloon(this.kBalloonTex, -30, -40);
    this.mLeftBalloon.getRenderable().setColor([1,0,0,0.5]);
    this.mLeftBalloon.setUpVector(this.mLeftCamera.getUpVector());
    this.world.mShapes.addToSet(this.mLeftBalloon);
    
    this.mRightBalloon = new Balloon(this.kBalloonTex, 30, -40);
    this.mRightBalloon.getRenderable().setColor([0,1,0,0.5]);
    this.mRightBalloon.setUpVector(this.mRightCamera.getUpVector());
    this.world.mShapes.addToSet(this.mRightBalloon);
    
    this.mSky = new SpriteRenderable(this.kSkyTex);
    this.mSky.getXform().setPosition(0, 0);
    this.mSky.getXform().setSize(400, 200);
    
    this.mLabels = new GameObjectSet();
};

MazeLevel.prototype.addLabel = function(text, color, x, y, h) {
    var m = new FontRenderable(text);
    m.setColor(color);
    m.getXform().setPosition(x, y);
    m.setTextHeight(h);
    this.mLabels.addToSet(m);
};

MazeLevel.prototype.drawView = function(aCamera) {
    aCamera.setupViewProjection();
    this.mSky.draw(aCamera);
    this.world.draw(aCamera);
    this.mLabels.draw(aCamera);
};

MazeLevel.prototype.draw = function () {
    // Step A: clear the canvas
    gEngine.Core.clearCanvas([0.9, 0.9, 0.9, 1.0]); // clear to light gray
    
    // Draw the left/right views
    this.drawView(this.mLeftCamera);
    this.drawView(this.mRightCamera);
    
    // Draw the map if 'M' is pressed
    if (gEngine.Input.isKeyPressed(gEngine.Input.keys.M))
        this.drawView(this.mMapCamera);
};

MazeLevel.prototype.updateCameras = function () {
    function followBalloon(cam, balloon, angle) {
        cam.setRotation(angle);
        cam.getWCCenter()[0] = balloon.getXform().getXPos();
        cam.getWCCenter()[1] = balloon.getXform().getYPos();
    }
    var angle = this.mSmoothAngle.getValue();
    followBalloon(this.mLeftCamera, this.mLeftBalloon, angle);
    followBalloon(this.mRightCamera, this.mRightBalloon, angle);
    this.mMapCamera.setRotation(angle);
};

MazeLevel.prototype.popBalloon = function (balloon) {
    this.mNextState = "Lose";
    gEngine.GameLoop.stop();
};

MazeLevel.prototype.win = function () {
    this.mNextState = "Win";
    gEngine.GameLoop.stop();
};

MazeLevel.prototype.update = function () {
    
    // Rotation controls
    if (gEngine.Input.isKeyClicked(gEngine.Input.keys.Left)) {
        this.mTargetAngle += Math.PI / 4;
        this.mSmoothAngle.setFinalValue(this.mTargetAngle);
    }
    if (gEngine.Input.isKeyClicked(gEngine.Input.keys.Right)) {
        this.mTargetAngle -= Math.PI / 4;
        this.mSmoothAngle.setFinalValue(this.mTargetAngle);
    }
    this.mSmoothAngle.updateInterpolation();
    
    // Update gameobjects
    this.world.update();
    
    // Test for collisions between balloons and spikes
    var wcCoord = [0,0];
    if (this.world.testHazards(this.mLeftBalloon, wcCoord))
        this.popBalloon(this.mLeftBalloon);
    if (this.world.testHazards(this.mRightBalloon, wcCoord))
        this.popBalloon(this.mRightBalloon);
    
    this.world.bumpIntoGates(this.mLeftBalloon);
    this.world.bumpIntoGates(this.mRightBalloon);
    
    this.world.pickupKeys(this.mLeftBalloon);
    this.world.pickupKeys(this.mRightBalloon);
    
    // Test balloon heights for win condition
    var up = this.mLeftCamera.getUpVector();
    var offset = [0,0];
    vec2.subtract(offset, this.mLeftBalloon.getXform().getPosition(), this.world.pos);
    var leftHeight = vec2.dot(offset, up);
    vec2.subtract(offset, this.mRightBalloon.getXform().getPosition(), this.world.pos);
    var rightHeight = vec2.dot(offset, up);
    if (leftHeight > this.kWinHeight && rightHeight > this.kWinHeight)
        this.win();
    
    
    var time = (Date.now() / 50000.0) % 1.0;
    console.log(time, time + 1.0);
    this.mSky.setElementUVCoordinate(time, time + 1.0, 0.0, 1.0);
    
    // Move cameras
    this.updateCameras();
    this.mSky.getXform().setRotationInRad(this.mSmoothAngle.getValue());
};
