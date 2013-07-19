window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       || 
          window.webkitRequestAnimationFrame || 
          window.mozRequestAnimationFrame    || 
          window.oRequestAnimationFrame      || 
          window.msRequestAnimationFrame     || 
          function(/* function */ callback, /* DOMElement */ element){
            window.setTimeout(callback, 1000 / 60);
          };
})();

/*var HEIGHT = $("body").height();
var WIDTH = $("body").width();


if (WIDTH >= HEIGHT * 1.5)
{
	WIDTH = HEIGHT * 1.5;
}
else
{
	HEIGHT = WIDTH * 2/3;
}*/

var HEIGHT = 400;
var WIDTH = HEIGHT * 1.5;

var shader = 
{
	'vertex': ["void main() {",
			   "gl_Position = projectionMatrix *",
			                  "modelViewMatrix *",
			                  "vec4(position,1.0);",
			   "}"].join("\n"),
			   
	'fragment': [	"uniform vec2 coordinateTransform;",
	             	"uniform float xLeft;",
	             	"uniform float xRight;",
	             	"uniform float yTop;",
	             	"uniform float yBottom;",
	             	"",
	             	"void main() {",
	             	"	vec2 p = vec2(0.0, 0.0);",
	             	"	p.x = gl_FragCoord.x / coordinateTransform.x;",
	             	"	p.x *= xRight - xLeft;",
	             	"	p.x += xLeft;",
	             	"	p.y = gl_FragCoord.y / coordinateTransform.y;",
	             	"	p.y *= yTop - yBottom;",
	             	"	p.y += yBottom;",
	             	"	vec2 constp = p;",
	             	"	int breakLoop = 0;",
	             	"	float check = 0.0;",
	             	"	float color = 0.0;",
	             	"	float color2 = 0.0;",
	             	"",
	             	"	for (int i=0; i<256; i++)",
	             	"	{",
	             	"		if (breakLoop == 0)",
	             	"		{",
	             	"			p = constp + vec2(p.x*p.x - p.y*p.y, 2.0*p.x*p.y);",
	             	"			color += 1.0;",
	             	"			check = p.x * p.x + p.y * p.y;",
	             	"			if (check >= 4.0)",
	             	"			{",
	             	"				breakLoop = 1;",
	             	"			}",
	             	"		}",
	             	"	}",
	             	"	",
	             	"",
	             	"	if (color>=128.0)",
	             	"	{",
	             	"		color = 128.0 - (color - 128.0);",
	             	"	}",
	             	"	",
	             	"	if (color<=50.0)",
	             	"	{",
	             	"		color2 = color/16.0;",
	             	"	}",
	             	"	color = color/256.0;",
	             	"	gl_FragColor = vec4(color, 0.0, color2, 1.0);",
	             	"}"].join("\n")
};

function setupScene() 
{
	var renderer = new THREE.WebGLRenderer();
	
	var camera = new THREE.OrthographicCamera(10 / - 2, 10 / 2, 10 / 2, 10 / - 2, 1, 1000);

	var scene = new THREE.Scene();
	
	// the camera starts at 0,0,0 so pull it back
	camera.position.z = 1;
	
	// start the renderer - set the clear colour
	// to a full black
	renderer.setClearColor(new THREE.Color(0, 1));
	renderer.setSize(WIDTH, HEIGHT);
	
	return {
		camera: camera,
		scene: scene,
		renderer: renderer
	};
}

$(document).ready(function()
{
	if (!Modernizr.webgl)
	{
	   var msg = "WebGL is needed to view this Page.<br>Please visit: <a href='http://get.webgl.org'>get.webgl.org</a>.";
	   $("#loading").html(msg);
	   return;
	}
	
	var setup = setupScene();

	// attach the render-supplied DOM element
	$("body").append(setup.renderer.domElement);
	
	$("canvas").css("left", ($("body").width() - WIDTH) / 2);

	var uniforms = {
		coordinateTransform: {
			type: "v2", 
			value: new THREE.Vector2(WIDTH, HEIGHT)
		},
		xLeft: {
			type: "f",
			value: -2
		},
		xRight: {
			type: "f",
			value: 1
		},
		yTop: {
			type: "f",
			value: 1
		},
		yBottom: {
			type: "f",
			value: -1
		}
	};
	
	var shaderMaterial = new THREE.ShaderMaterial({
		uniforms:		uniforms,
		vertexShader:   shader.vertex,
	    fragmentShader: shader.fragment
	});
	
	var plane = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), shaderMaterial);
	
	setup.scene.add(plane);
	
	setup.renderer.render(setup.scene, setup.camera);

	function update() 
	{
	    setup.renderer.render(setup.scene, setup.camera);
		
	    requestAnimFrame(update);
	}
	requestAnimFrame(update);
	
	$("#preview").css("display", "none");
	$("#loading").css("display", "none");
	
	function zoom (clientX, clientY, zoomFactor)
	{
		var mouseX = clientX;
		var mouseY = clientY;
		
		var fractalMouseX = mouseX / WIDTH;
		fractalMouseX *= uniforms.xRight.value - uniforms.xLeft.value;
		fractalMouseX += uniforms.xLeft.value;
		
		var fractalMouseY = 1 - mouseY / HEIGHT;
		fractalMouseY *= uniforms.yTop.value - uniforms.yBottom.value;
		fractalMouseY += uniforms.yBottom.value;
		
		var xLength = uniforms.xRight.value - uniforms.xLeft.value;
		var xZoomLength = xLength * zoomFactor;
		
		var yLength = uniforms.yTop.value - uniforms.yBottom.value;
		var yZoomLength = yLength * zoomFactor;
		
		uniforms.xLeft.value = fractalMouseX - Math.abs(uniforms.xLeft.value - fractalMouseX) * zoomFactor;
		uniforms.xRight.value = fractalMouseX + Math.abs(uniforms.xRight.value - fractalMouseX) * zoomFactor;
		uniforms.yTop.value = fractalMouseY + Math.abs(uniforms.yTop.value - fractalMouseY) * zoomFactor;
		uniforms.yBottom.value = fractalMouseY - Math.abs(uniforms.yBottom.value - fractalMouseY) * zoomFactor;
	}
	
	function move (xRight, xLeft, yTop, yBottom, clientXOld, clientYOld, clientX, clientY)
	{
		var fractalMouseXOld = clientXOld / WIDTH;
		fractalMouseXOld *= xRight - xLeft;
		fractalMouseXOld += xLeft;
		
		var fractalMouseYOld = 1 - clientYOld / HEIGHT;
		fractalMouseYOld *= yTop - yBottom;
		fractalMouseYOld += yBottom;
		
		var fractalMouseX = clientX / WIDTH;
		fractalMouseX *= xRight - xLeft;
		fractalMouseX += xLeft;
		
		var fractalMouseY = 1 - clientY / HEIGHT;
		fractalMouseY *= yTop - yBottom;
		fractalMouseY += yBottom;
		
		var xLengthOld = xRight - xLeft;
		var yLengthOld = yTop - yBottom;
		
		var xLength = uniforms.xRight.value - uniforms.xLeft.value;
		var yLength = uniforms.yTop.value - uniforms.yBottom.value;
		
		var xCenter = xLeft+ xLengthOld / 2;
		var yCenter = yBottom + yLengthOld / 2;
		
		var xNew = xCenter + fractalMouseXOld - fractalMouseX;
		var yNew = yCenter + fractalMouseYOld - fractalMouseY;
		
		uniforms.xLeft.value = xNew - xLength / 2;
		uniforms.xRight.value = xNew + xLength / 2;
		uniforms.yTop.value = yNew + yLength / 2;
		uniforms.yBottom.value = yNew - yLength / 2;
	}
	
	$("canvas").mousewheel(function(event, delta, deltaX, deltaY) 
	{
		if(deltaY>0)
		{
			//Zoom In
			zoom (event.clientX, event.clientY, 0.8);
		}
		else
		{
			//Zoom Out
			zoom (event.clientX, event.clientY, 1.25);
		}
	});
	
	var isDragging = false;
	var xRight 	= uniforms.xRight.value;
	var xLeft  	= uniforms.xLeft.value;
	var yTop 	= uniforms.yTop.value;
	var yBottom = uniforms.yBottom.value;
	var mouseDownX;
	var mouseDownY;
	
	$("canvas")
	.mousedown(function(event) {
		xRight 	= uniforms.xRight.value;
		xLeft  	= uniforms.xLeft.value;
		yTop 	= uniforms.yTop.value;
		yBottom = uniforms.yBottom.value;
		mouseDownX = event.clientX;
		mouseDownY = event.clientY;
		console.log("mousedown " + event.clientX + " " + event.clientY);
	    $("canvas").mousemove(function(event) {
	        isDragging = true;
	        console.log("mousemove " + event.clientX + " " + event.clientY);
	        move (xRight, xLeft, yTop, yBottom, mouseDownX, mouseDownY, event.clientX, event.clientY);
	    });
	})
	.mouseup(function() {
	    isDragging = false;
	    $("canvas").unbind("mousemove");
	});
});
