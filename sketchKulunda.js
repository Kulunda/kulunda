/******************
Code by Vamoss
Original code link:
https://openprocessing.org/sketch/1268568

Author links:
http://vamoss.com.br
http://twitter.com/vamoss
http://github.com/vamoss
******************/

//this code history
//started with this refraction: https://codepen.io/xdesro/pen/JxOrqe
//migrated to this refraction: https://threejs.org/examples/#webgl_materials_cubemap_refraction
//included water: https://threejs.org/examples/?q=water#webgl_shaders_ocean

let config = {
	scale: 0.2,
	height: 6.8,
	heightTop: 3,
	heightBottom: 3,
	radiusTop: 4.3,
	radiusBottom: 4,
	radialSegments: 5,
	dryWet: 1
};

var url_string = window.location.href;
var url = new URL(url_string);
var vissungoId = url.searchParams.get("vissungo");
if(!vissungoId) vissungoId = "01";

//rithm config
var firstHit, interval, hits, precision;
if(vissungoId == "01") {
	firstHit = 0;
	interval = 3451;
	hits = [573, 1167, 2249, 2844];
	precision = 150;
}else if(vissungoId == "02") {
	firstHit = 0;
	interval = 2726.83333;
	hits = [457, 920, 1771, 2243];
	precision = 150;
}else if(vissungoId == "03") {
	firstHit = 0;
	interval = 3940.3;
	hits = [509, 1074, 2473, 3048];
	precision = 250;
}else if(vissungoId == "04") {
	firstHit = 83;
	interval = 4144.1;
	hits = [616, 1210, 2684, 3281];
	precision = 250;
}

//audio from p5js
var reverb;
var vissungo;
var picareta;
var tambor;
function preload(){
	vissungo = loadSound('sounds/vissungo' + vissungoId + '.mp3');
	picareta = loadSound('sounds/picareta.mp3');
	tambor = loadSound('sounds/tambor.mp3');
}

//random
function random_hash() {
	let chars = "0123456789abcdef";
	let result = '0x';
	for (let i = 64; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
	return result;
}
var hash = random_hash();
var seed = parseInt(hash.slice(0, 16), 16);
var p = [];
for (var j = 0; j < 32; j++) {
		 p.push(hash.slice(2 + (j * 2), 4 + (j * 2)));
}
var rns = p.map(x => {
		 return parseInt(x, 16);
});
function customRandom(index, from, to){
	return rns[index] / 256 * (from - to) + to;
}
function customRandomPct(pct, from, to){
	return pct * (from - to) + to;
}


function setup(){
	noCanvas();
	vissungo.play();
	reverb = new p5.Reverb();
  vissungo.disconnect(); // so we'll only hear reverb...
	
	// connect soundFile to reverb, process w/
  // 3 second reverbTime, decayRate of 2%
  reverb.process(vissungo, 3, 2);
}

//ref
//https://codepen.io/xdesro/pen/JxOrqe
function init() {
	var camera = new THREE.PerspectiveCamera(
		50,
		window.innerWidth / window.innerHeight,
		0.1,
		100000
	);
	var scene = null;
	var renderer = null;
	var mesh = null;
	var controls = null;
	var material = null;
	var cristal = new THREE.Group();
	
	
	var gui = new dat.GUI();
	gui.add(config, 'scale', 0, 0.5);
	gui.add(config, 'height', 1, 10);
	gui.add(config, 'heightTop', 1, 10);
	gui.add(config, 'heightBottom', 1, 10);
	gui.add(config, 'radiusTop', 2, 10);
	gui.add(config, 'radiusBottom', 2, 10);
	gui.add(config, 'radialSegments', 3, 10, 1);
	gui.add(config, 'dryWet', 0, 1);
	for (let controller of gui.__controllers) controller.onChange(buildCristal);
	//dat.GUI.toggleHide();
	
	var windowHalfX = window.innerWidth / 2;
	var windowHalfY = window.innerHeight / 2;

    camera.position.z = 10;
    camera.position.x = -10;

		/*
    const path =
      "https://s3-us-west-2.amazonaws.com/s.cdpn.io/1147877/winter-hdri_";
    const format = ".png";
    const order = ["px", "nx", "py", "ny", "pz", "nz"];
    const urls = [];
    order.forEach(side => {
      urls.push(`${path}${side}${format}`);
    });
		*/
	const urls = [];
	urls.push("images/img" + vissungoId + ".png");
	urls.push("images/img" + vissungoId + ".png");
	urls.push("images/img" + vissungoId + ".png");
	urls.push("images/img" + vissungoId + ".png");
	urls.push("images/img" + vissungoId + ".png");
	urls.push("images/img" + vissungoId + ".png");
		
    const textureCube = new THREE.CubeTextureLoader().load(urls);
    textureCube.format = THREE.RGBFormat;
	textureCube.mapping = THREE.CubeRefractionMapping;

    scene = new THREE.Scene();
    scene.background = textureCube;
	scene.matrixAutoUpdate = true;
		
	const ambient = new THREE.AmbientLight( 0xffffff );
	scene.add( ambient );

	material = new THREE.MeshPhongMaterial({
		color: 0xccddff,
		envMap: textureCube,
		refractionRatio: 0.98,
		reflectivity: 0.9
	});
	
	/*
	material = new THREE.MeshPhysicalMaterial({
		color: 0xffffff,
		roughness: 0.75,
		transmission: 0.5,
		thickness: 0.5,
		transparent: true,
		envMap: textureCube,
	});
	*/
	
	buildCristal();
	
	
	// Water
	const waterGeometry = new THREE.PlaneGeometry( 10000, 10000 );
	water = new THREE.Water(
		waterGeometry,
		{
			textureWidth: 512,
			textureHeight: 512,
			waterNormals: new THREE.TextureLoader().load( 'images/waternormals.jpg', function ( texture ) {
				texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
			} ),
			sunDirection: new THREE.Vector3(),
			sunColor: 0xffffff,
			waterColor: 0x001e0f,
			distortionScale: 1.0,
			fog: scene.fog !== undefined
		}
	);
	water.rotation.x = - Math.PI / 2;
	water.position.y = -2;
	scene.add( water );

	//renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
    document.body.appendChild(renderer.domElement);


	// Skybox
	var sun = new THREE.Vector3();
	const sky = new THREE.Sky();
	sky.scale.setScalar( 10000 );
	scene.add( sky );
	const skyUniforms = sky.material.uniforms;
	skyUniforms[ 'turbidity' ].value = 10;
	skyUniforms[ 'rayleigh' ].value = 2;
	skyUniforms[ 'mieCoefficient' ].value = 0.005;
	skyUniforms[ 'mieDirectionalG' ].value = 0.8;
	const parameters = {
		elevation: -3,
		azimuth: 90
	};
	const pmremGenerator = new THREE.PMREMGenerator( renderer );
	function updateSun() {
		setSunPosition(90 - parameters.elevation, parameters.azimuth);
	}
	function setSunPosition(elevation, azimuth){
		const phi = THREE.MathUtils.degToRad( elevation );
		const theta = THREE.MathUtils.degToRad( azimuth );
		sun.setFromSphericalCoords( 1, phi, theta );
		sky.material.uniforms[ 'sunPosition' ].value.copy( sun );
		water.material.uniforms[ 'sunDirection' ].value.copy( sun ).normalize();
		scene.environment = pmremGenerator.fromScene( sky ).texture;
	}
	updateSun();
	


	const folderSky = gui.addFolder( 'Sky' );
	folderSky.add( parameters, 'elevation', 0, 90, 0.1 ).onChange( updateSun );
	folderSky.add( parameters, 'azimuth', - 180, 180, 0.1 ).onChange( updateSun );
	folderSky.open();


	const waterUniforms = water.material.uniforms;

	const folderWater = gui.addFolder( 'Water' );
	folderWater.add( waterUniforms.distortionScale, 'value', 0, 8, 0.1 ).name( 'distortionScale' );
	folderWater.add( waterUniforms.size, 'value', 0.1, 10, 0.1 ).name( 'size' );
	folderWater.open();

		
	function onWindowResize() {
		windowHalfX = window.innerWidth / 2;
		windowHalfY = window.innerHeight / 2;
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
	}
    window.addEventListener("resize", onWindowResize, false);
		
	//Controls
	controls = new THREE.OrbitControls(camera, renderer.domElement);
	controls.autoRotate = true;
	controls.autoRotateSpeed = 0.5;
	controls.maxPolarAngle = Math.PI/2+0.13;
	var autorotateTimeout = null;
	controls.addEventListener('start', function(){
		clearTimeout(autorotateTimeout);
		//controls.autoRotate = false;
	});
	controls.addEventListener('end', function(){
		autorotateTimeout = setTimeout(function(){
			//controls.autoRotate = true;
		}, 1000);
	});
		
	// Audio
	function isOnRhythm(){
		if(!vissungo) return false;
		var seconds = vissungo.currentTime();
		var millis = Math.floor(seconds * 1000 - firstHit);
		var sample = millis % interval;
		var rule = false;
		hits.forEach(hit => {
			rule |= sample > hit-precision && sample < hit+precision;	
		});
		//console.log(millis, millis%interval, rule);
		return rule;
	}
	//MouseEvents
	document.addEventListener("mousedown", function(e){
		//not loaded
		if(!vissungo)
			return false;

		//song ended
		if(vissungo.currentTime() > vissungo.duration() - 0.1)
			return false;

		//grow or shirnk the cristal
		var growthFactor = 1;
		if(isOnRhythm()){
			growthFactor = 3;
			tambor.play();
		}else{
			growthFactor = -1;
			picareta.play();
		}
		if(config.scale < 0.5)
			config.scale += 0.01 * growthFactor * Math.pow(0.3 + customRandom(0, 0, 1), 5);
		if(config.height < 10)
			config.height += 0.1 * growthFactor * Math.pow(0.3 + customRandom(1, 0, 1), 5);
		if(config.heightTop < 10)
			config.heightTop += 0.1 * growthFactor * Math.pow(0.1 + customRandom(2, 0, 1), 5);
		if(config.heightBottom < 10)
			config.heightBottom += 0.1 * growthFactor * Math.pow(0.1 + customRandom(3, 0, 1), 5);
		if(config.radiusTop < 10)
			config.radiusTop += 0.1 * growthFactor * Math.pow(0.1 + customRandom(4, 0, 1), 5);
		if(config.radiusBottom < 10)
			config.radiusBottom += 0.1 * growthFactor * Math.pow(0.1 + customRandom(5, 0, 1), 5);
		config.radialSegments += 0.1 * growthFactor * Math.pow(0.1 + customRandom(6, 0, 1), 5);
		
		for (var i in gui.__controllers) {
			gui.__controllers[i].updateDisplay();
		}
		
		buildCristal();
	});
	
	function buildCristal(){
		for (var i = cristal.children.length - 1; i >= 0; i--) {
				cristal.remove(cristal.children[i]);
		}
		
		cristal.scale.x = cristal.scale.y = cristal.scale.z = config.scale;
		
		var segments = Math.floor(config.radialSegments);
		const geometry1 = new THREE.ConeGeometry(config.radiusTop, config.heightTop, segments);
		geometry1.computeVertexNormals();
		var mesh1 = new THREE.Mesh(geometry1, material);
		mesh1.position.y += config.height/2 + config.heightTop/2;
		cristal.add(mesh1);
		
		const geometry2 = new THREE.ConeGeometry(config.radiusBottom, config.heightBottom, segments);
		geometry2.computeVertexNormals();
		var mesh2 = new THREE.Mesh(geometry2, material);
		mesh2.position.y -= config.height/2 + config.heightBottom/2;
		mesh2.rotation.x = Math.PI;
		mesh2.rotation.y = (segments % 2 == 0) ? 0 : Math.PI / segments;
		cristal.add(mesh2);
		
		const geometry3 = new THREE.CylinderGeometry(config.radiusTop, config.radiusBottom, config.height, segments);
		geometry3.computeVertexNormals();
		var mesh3 = new THREE.Mesh(geometry3, material);
		cristal.add(mesh3);

		cristal.position.y = (config.height/2 + config.heightBottom) * config.scale -2;
		scene.add(cristal);
	}
	
	//rhythm viz
	var lastRhythmState = true;
	var lastRhythmTime = 0;
	var lastRhythmDiv;
	var rhythmVizEl = document.querySelector(".rhythmViz");


	var stats = new Stats();
	stats.showPanel( 1 ); // 0: fps, 1: ms, 2: mb, 3+: custom
	//document.body.appendChild( stats.dom );


	//performance monitor
	var prevTime = Date.now(), frames = 0;

	var updateSunSpeed = 4;

	var phase = 0;
	var customFrameCount = 0;
	function animate() {
		customFrameCount++;
		phase = camera.rotation.x + camera.rotation.y + camera.rotation.z;
		//phase += dist(mouseX, mouseY, pmouseX, pmouseY) / 100;
		var dryWet = (Math.sin(phase) + 1) / 2;
		if(reverb){
			// 1 = all reverb, 0 = no reverb
			reverb.drywet(dryWet / 2);
		}

		water.material.uniforms[ 'time' ].value += 1.0 / 120.0;

		if(vissungo){
			var audioPct = vissungo.currentTime() / vissungo.duration();
			if(!isNaN(audioPct) && customFrameCount%updateSunSpeed == 0){
				var elevation = 93 - ((Math.sin(audioPct * TWO_PI -HALF_PI) + 1) / 2) * 90;
				var azimuth = audioPct * 180 + 90;
				setSunPosition(elevation, azimuth);
			}

			//DEBUG RHYTHM
			/*
			var onRhythm = isOnRhythm();
			if(onRhythm != lastRhythmState){
				lastRhythmState = onRhythm;

				var div = document.createElement("div");
				div.className = onRhythm ? "on" : "off";
				div.style.left = (audioPct * 100) + "%";
				rhythmVizEl.appendChild(div);

				var span = document.createElement("span");
				div.appendChild(span);
				span.innerText = Math.floor(vissungo.currentTime() * 1000);
				
				if(lastRhythmDiv)
					lastRhythmDiv.style.width = ((vissungo.currentTime() - lastRhythmTime) / vissungo.duration() * 100) + "%";
			
				lastRhythmDiv = div;
				lastRhythmTime = vissungo.currentTime();
			}
			/**/
		}
			
		render();
		stats.end();

		//performance
		frames++;
		var time = Date.now();
		if ( time >= prevTime + 1000 ) {
			if(frames >= 60) {
				updateSunSpeed = 2;
			}else if(frames >= 40) {
				updateSunSpeed = 4;
			}else if(frames >= 20) {
				updateSunSpeed = 8;
			}else{
				updateSunSpeed = 16;
			}

			prevTime = time;
			frames = 0;
		}

		requestAnimationFrame(animate.bind(this));
	}
	function render() {
		controls.update();
		renderer.render(scene, camera);
	}

	animate();
}

document.addEventListener("DOMContentLoaded", init);