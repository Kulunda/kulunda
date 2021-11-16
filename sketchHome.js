let cols = 10;
let rows = 10;

let sz = 200;
let w = sz;
let h = sz;

function setup() {
    createCanvas(windowWidth, windowHeight, WEBGL);
    calcOrtho();
    smooth();
    strokeWeight(2);
    stroke(255);
    noFill();
    noiseDetail(0.5, 5);
}

function draw() {
  background(0);
	
	rotateX(radians(45));
	rotateY(radians(45));

	translate(-(w*cols)/2+ w/2,0,-(w*rows)/2+ w/2);
	
	for(let z = 0; z < cols; z++){
		for(let x = 0; x < rows; x++){
			push();
			translate(x * w,0, z * w);
			
			// let n = noise(x*0.01, z* 0.01) * 210;
			
			let rz = random(-1,1) * 130;
			let rx = random(-1,1) * 130;
			
			// translate(rx,0,rz);
			
			// if(random() < 0.15)
			
			let rrx = random(-2,2);
			let rry = random(-2,2);
			let rrz = random(-2,2);

			// let rrx = noise(x * 0.51, z * 0.1+ 10)*TAU;
			// let rry = noise(x * 0.51, z * 0.1+ 30)*TAU;
			// let rrz = noise(x * 0.51, z * 0.1+ 50)*TAU;

			angleX = lerp(0,  mouseX , 0.006 );
			angleY = lerp(0,  mouseY , 0.006);
			rotateX(angleX);
			rotateY(angleY);
			rotateZ(2);
		
				sphere(noise(x * 0.5, z * 0.1 + 10) * w*1 ,5,2);
			
			pop();
		}
	}
	
}

function calcOrtho() {
    ortho(-width / 2, width / 2, height / 2, -height / 2, 0, 2000);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    calcOrtho();
}