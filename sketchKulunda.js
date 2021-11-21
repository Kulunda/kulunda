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
	scale: 0.1,
	height: 6.8,
	heightTop: 3,
	heightBottom: 3,
	radiusTop: 4.3,
	radiusBottom: 4,
	radialSegments: 4,
	dryWet: 1
};

//audio from p5js
var reverb;
var vissungo;
var picareta;
var tambor;
function preload(){
	vissungo = loadSound('sounds/Vissungo.mp3');
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
	dat.GUI.toggleHide();
	
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
	urls.push("images/img01.png");
	urls.push("images/img01.png");
	urls.push("images/img01.png");
	urls.push("images/img01.png");
	urls.push("images/img01.png");
	urls.push("images/img01.png");
		
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
		elevation: 2,
		azimuth: 180
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
	//MouseEvents
	document.addEventListener("mousedown", function(e){
		const firstHit = 0;
		const interval = 3000;
		const hits = [507, 1003, 1950, 2456];
		const precision = 150;
		var seconds = vissungo.currentTime();
		var millis = Math.floor(seconds * 1000 - firstHit);
		var sample = millis % interval;
		var rule = false;
		hits.forEach(hit => {
			rule |= sample > hit-precision && sample < hit+precision;	
		});
		//console.log(millis, millis%interval, rule);
		var growthFactor = 1;
		if(rule){
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
	
	var phase = 0;
	function animate() {
			phase = camera.rotation.x + camera.rotation.y + camera.rotation.z;
			//phase += dist(mouseX, mouseY, pmouseX, pmouseY) / 100;
			var dryWet = (Math.sin(phase) + 1) / 2;
			if(reverb){
				// 1 = all reverb, 0 = no reverb
				reverb.drywet(dryWet);
			}

			if(vissungo){
				var audioPct = vissungo.currentTime() / vissungo.duration();
				if(!isNaN(audioPct)){
					var elevation = 93 - ((Math.sin(audioPct * TWO_PI -HALF_PI) + 1) / 2) * 90;
					var azimuth = audioPct * 180 + 90;
					setSunPosition(elevation, azimuth);
				}
			}
			
		requestAnimationFrame(animate.bind(this));
		render();
	}
	function render() {
		controls.update();
		renderer.render(scene, camera);
	}

	animate();
}

document.addEventListener("DOMContentLoaded", init);