import {
	UVMapping,
	CubeReflectionMapping,
	CubeRefractionMapping,
	EquirectangularReflectionMapping,
	EquirectangularRefractionMapping,
	SphericalReflectionMapping,
	CubeUVReflectionMapping,
	CubeUVRefractionMapping,

	RepeatWrapping,
	ClampToEdgeWrapping,
	MirroredRepeatWrapping,

	NearestFilter,
	NearestMipMapNearestFilter,
	NearestMipMapLinearFilter,
	LinearFilter,
	LinearMipMapNearestFilter,
	LinearMipMapLinearFilter
} from '../constants';
import { Color } from '../math/Color';
import { Matrix4 } from '../math/Matrix4';
import { Object3D } from '../core/Object3D';
import { Group } from '../objects/Group';
import { Sprite } from '../objects/Sprite';
import { Points } from '../objects/Points';
import { Line } from '../objects/Line';
import { LineLoop } from '../objects/LineLoop';
import { LineSegments } from '../objects/LineSegments';
import { LOD } from '../objects/LOD';
import { Mesh } from '../objects/Mesh';
import { SkinnedMesh } from '../objects/SkinnedMesh';
import { Fog } from '../scenes/Fog';
import { FogExp2 } from '../scenes/FogExp2';
import { HemisphereLight } from '../lights/HemisphereLight';
import { SpotLight } from '../lights/SpotLight';
import { PointLight } from '../lights/PointLight';
import { DirectionalLight } from '../lights/DirectionalLight';
import { AmbientLight } from '../lights/AmbientLight';
import { RectAreaLight } from '../lights/RectAreaLight';
import { OrthographicCamera } from '../cameras/OrthographicCamera';
import { PerspectiveCamera } from '../cameras/PerspectiveCamera';
import { Scene } from '../scenes/Scene';
import { Texture } from '../textures/Texture';
import { VideoTexture } from '../textures/VideoTexture';
import { ImageLoader } from './ImageLoader';
import { LoadingManager, DefaultLoadingManager } from './LoadingManager';
import { AnimationClip } from '../animation/AnimationClip';
import { MaterialLoader } from './MaterialLoader';
import { BufferGeometryLoader } from './BufferGeometryLoader';
import { JSONLoader } from './JSONLoader';
import { FileLoader } from './FileLoader';
import * as Geometries from '../geometries/Geometries';

/**
 * @author mrdoob / http://mrdoob.com/
 */

function ObjectLoader( manager ) {

	this.manager = ( manager !== undefined ) ? manager : DefaultLoadingManager;
	this.texturePath = '';

}

Object.assign( ObjectLoader.prototype, {

	load: function ( url, onLoad, onProgress, onError ) {

		if ( this.texturePath === '' ) {

			this.texturePath = url.substring( 0, url.lastIndexOf( '/' ) + 1 );

		}

		var scope = this;

		var loader = new FileLoader( scope.manager );
		loader.load( url, function ( text ) {

			var json = null;

			try {

				json = JSON.parse( text );

			} catch ( error ) {

				if ( onError !== undefined ) onError( error );

				console.error( 'THREE:ObjectLoader: Can\'t parse ' + url + '.', error.message );

				return;

			}

			var metadata = json.metadata;

			if ( metadata === undefined || metadata.type === undefined || metadata.type.toLowerCase() === 'geometry' ) {

				console.error( 'THREE.ObjectLoader: Can\'t load ' + url + '. Use THREE.JSONLoader instead.' );
				return;

			}

			scope.parse( json, onLoad );

		}, onProgress, onError );

	},

	setTexturePath: function ( value ) {

		this.texturePath = value;

	},

	setCrossOrigin: function ( value ) {

		this.crossOrigin = value;

	},

	parse: function ( json, onLoad ) {

		var geometries = this.parseGeometries( json.geometries );

		var images = this.parseImages( json.images, function () {

			if ( onLoad !== undefined ) onLoad( object );

		} );
        
        var videos = this.parseVideos( json.videos, function() {
            if (onLoad !== undefined) onLoad(object);
        } );

		var textures  = this.parseTextures( json.textures, images , videos);
		var materials = this.parseMaterials( json.materials, textures );

		var object = this.parseObject( json.object, geometries, materials );

		if ( json.animations ) {

			object.animations = this.parseAnimations( json.animations );

		}

		if ( json.images === undefined || json.images.length === 0 ) {

			if ( onLoad !== undefined ) onLoad( object );

		}

		return object;

	},

	parseGeometries: function ( json ) {

		var geometries = {};

		if ( json !== undefined ) {

			var geometryLoader = new JSONLoader();
			var bufferGeometryLoader = new BufferGeometryLoader();

			for ( var i = 0, l = json.length; i < l; i ++ ) {

				var geometry;
				var data = json[ i ];

				switch ( data.type ) {

					case 'PlaneGeometry':
					case 'PlaneBufferGeometry':

						geometry = new Geometries[ data.type ](
							data.width,
							data.height,
							data.widthSegments,
							data.heightSegments
						);

						break;

					case 'BoxGeometry':
					case 'BoxBufferGeometry':
					case 'CubeGeometry': // backwards compatible

						geometry = new Geometries[ data.type ](
							data.width,
							data.height,
							data.depth,
							data.widthSegments,
							data.heightSegments,
							data.depthSegments
						);

						break;

					case 'CircleGeometry':
					case 'CircleBufferGeometry':

						geometry = new Geometries[ data.type ](
							data.radius,
							data.segments,
							data.thetaStart,
							data.thetaLength
						);

						break;

					case 'CylinderGeometry':
					case 'CylinderBufferGeometry':

						geometry = new Geometries[ data.type ](
							data.radiusTop,
							data.radiusBottom,
							data.height,
							data.radialSegments,
							data.heightSegments,
							data.openEnded,
							data.thetaStart,
							data.thetaLength
						);

						break;

					case 'ConeGeometry':
					case 'ConeBufferGeometry':

						geometry = new Geometries[ data.type ](
							data.radius,
							data.height,
							data.radialSegments,
							data.heightSegments,
							data.openEnded,
							data.thetaStart,
							data.thetaLength
						);

						break;

					case 'SphereGeometry':
					case 'SphereBufferGeometry':

						geometry = new Geometries[ data.type ](
							data.radius,
							data.widthSegments,
							data.heightSegments,
							data.phiStart,
							data.phiLength,
							data.thetaStart,
							data.thetaLength
						);

						break;

					case 'DodecahedronGeometry':
					case 'IcosahedronGeometry':
					case 'OctahedronGeometry':
					case 'TetrahedronGeometry':

						geometry = new Geometries[ data.type ](
							data.radius,
							data.detail
						);

						break;

					case 'RingGeometry':
					case 'RingBufferGeometry':

						geometry = new Geometries[ data.type ](
							data.innerRadius,
							data.outerRadius,
							data.thetaSegments,
							data.phiSegments,
							data.thetaStart,
							data.thetaLength
						);

						break;

					case 'TorusGeometry':
					case 'TorusBufferGeometry':

						geometry = new Geometries[ data.type ](
							data.radius,
							data.tube,
							data.radialSegments,
							data.tubularSegments,
							data.arc
						);

						break;

					case 'TorusKnotGeometry':
					case 'TorusKnotBufferGeometry':

						geometry = new Geometries[ data.type ](
							data.radius,
							data.tube,
							data.tubularSegments,
							data.radialSegments,
							data.p,
							data.q
						);

						break;

					case 'LatheGeometry':
					case 'LatheBufferGeometry':

						geometry = new Geometries[ data.type ](
							data.points,
							data.segments,
							data.phiStart,
							data.phiLength
						);

						break;

					case 'BufferGeometry':

						geometry = bufferGeometryLoader.parse( data );

						break;

					case 'Geometry':

						geometry = geometryLoader.parse( data, this.texturePath ).geometry;

						break;

					default:

						console.warn( 'THREE.ObjectLoader: Unsupported geometry type "' + data.type + '"' );

						continue;

				}

				geometry.uuid = data.uuid;

				if ( data.name !== undefined ) geometry.name = data.name;

				geometries[ data.uuid ] = geometry;

			}

		}

		return geometries;

	},

	parseMaterials: function ( json, textures ) {

		var materials = {};

		if ( json !== undefined ) {

			var loader = new MaterialLoader();
			loader.setTextures( textures );

			for ( var i = 0, l = json.length; i < l; i ++ ) {

				var data = json[ i ];

				if ( data.type === 'MultiMaterial' ) {

					// Deprecated

					var array = [];

					for ( var j = 0; j < data.materials.length; j ++ ) {

						array.push( loader.parse( data.materials[ j ] ) );

					}

					materials[ data.uuid ] = array;

				} else {

					materials[ data.uuid ] = loader.parse( data );

				}

			}

		}

		return materials;

	},

	parseAnimations: function ( json ) {

		var animations = [];

		for ( var i = 0; i < json.length; i ++ ) {

			var clip = AnimationClip.parse( json[ i ] );

			animations.push( clip );

		}

		return animations;

	},

	parseImages: function ( json, onLoad ) {

		var scope = this;
		var images = {};

		function loadImage( name, url ) {

			scope.manager.itemStart( url );

			return loader.load( name, url, function () {

				scope.manager.itemEnd( url );

			}, undefined, function () {

				scope.manager.itemEnd( url );
				scope.manager.itemError( url );

			} );

		}

		if ( json !== undefined && json.length > 0 ) {

			var manager = new LoadingManager( onLoad );

			var loader = new ImageLoader( manager );
			loader.setCrossOrigin( "anonymous" );

			for ( var i = 0, l = json.length; i < l; i ++ ) {

				var image = json[ i ];
                var name = image.name;
				var path = /^(\/\/)|([a-z]+:(\/\/)?)/i.test( image.url ) ? image.url : scope.texturePath + image.url;

				let uuid = image.uuid;
				images[uuid] = loadImage(name, path);
				images[uuid].setAttribute('available', 'false');
				images[uuid].onload = function (uuid) {
					this.setAttribute('available', 'true');

					/*BIG HACK!!! Remove from here asap */
					if (editor && editor.timeliner)
						editor.timeliner.repaint();
					if (window.ui && ui.angular)
						ui.angular.$rootScope.$digest();
				}
				images[uuid].onerror = function () {
					this.setAttribute('network-error', 'true');
				}
			}

		}

		return images;

	},
    
    parseVideos: function ( json, onLoad ) {

		var scope = this;
		var videos = {};

		function loadVideo( url ) {
			var videos =[document.createElement('video'), document.createElement('video')];
			_.forEach(videos, function(video){
				video.setAttribute("style", "display:none");
				video.setAttribute('crossorigin', 'anonymous');
				video.setAttribute('available', 'false');
				video.autobuffer = true;
				video.preload = "auto";
				video.src = url;
				video.onloadedmetadata = function () {
					this.setAttribute('available', 'true');
					/*BIG HACK!!! Remove from here asap */
					if (editor && editor.timeliner)
						editor.timeliner.repaint();
					if (window.ui && ui.angular)
						ui.angular.$rootScope.$digest();
				}
				video.onerror = function () {
					this.setAttribute('network-error', 'true');
				}
				document.body.appendChild(video);
			});
			return videos;
		}

		if ( json !== undefined && json.length > 0 ) {

			var manager = new LoadingManager( onLoad );

			var loader = new ImageLoader( manager );
			loader.setCrossOrigin( this.crossOrigin );

			for ( var i = 0, l = json.length; i < l; i ++ ) {

				var video = json[ i ];
				var path = /^(\/\/)|([a-z]+:(\/\/)?)/i.test( video.url ) ? video.url : scope.texturePath + video.url;

				videos[ video.uuid ] = loadVideo( path );

			}

		}

		return videos;

	},


	parseTextures: function ( json, images, videos ) {

		function parseConstant( value, type ) {

			if ( typeof( value ) === 'number' ) return value;

			console.warn( 'THREE.ObjectLoader.parseTexture: Constant should be in numeric form.', value );

			return type[ value ];

		}

		var textures = {};

		if ( json !== undefined ) {

			for ( var i = 0, l = json.length; i < l; i ++ ) {

				var data = json[ i ];

				if ( data.image === undefined && data.video === undefined) {

					console.warn( 'THREE.ObjectLoader: No "image" or "video" specified for', data.uuid );

				}

				if ( images[ data.image ] === undefined && videos[ data.video ] === undefined ) {

					console.warn( 'THREE.ObjectLoader: Undefined image or video', data.image );

				}

				if( data.image !== undefined)
                {
                    var texture = new Texture( images[ data.image ] );
                }
                if( data.video !== undefined)
                {
                    var texture = new VideoTexture(videos[ data.video ][0]);
					videos[ data.video ][0].className = data.uuid+" active";
					videos[ data.video ][1].className = data.uuid+" dormant";
                }
				texture.needsUpdate = true;

				texture.uuid = data.uuid;

				if ( data.name !== undefined ) texture.name = data.name;

				if ( data.mapping !== undefined ) texture.mapping = parseConstant( data.mapping, TEXTURE_MAPPING );

				if ( data.offset !== undefined ) texture.offset.fromArray( data.offset );
				if ( data.repeat !== undefined ) texture.repeat.fromArray( data.repeat );
				if ( data.wrap !== undefined ) {

					texture.wrapS = parseConstant( data.wrap[ 0 ], TEXTURE_WRAPPING );
					texture.wrapT = parseConstant( data.wrap[ 1 ], TEXTURE_WRAPPING );

				}

				if ( data.minFilter !== undefined ) texture.minFilter = parseConstant( data.minFilter, TEXTURE_FILTER );
				if ( data.magFilter !== undefined ) texture.magFilter = parseConstant( data.magFilter, TEXTURE_FILTER );
				if ( data.anisotropy !== undefined ) texture.anisotropy = data.anisotropy;

				if ( data.flipY !== undefined ) texture.flipY = data.flipY;

				textures[ data.uuid ] = texture;

			}

		}

		return textures;

	},

	parseObject: function () {

		var matrix = new Matrix4();

		return function parseObject( data, geometries, materials ) {

			var object;

			function getGeometry( name ) {

				if ( geometries[ name ] === undefined ) {

					console.warn( 'THREE.ObjectLoader: Undefined geometry', name );

				}

				return geometries[ name ];

			}

			function getMaterial( name ) {

				if ( name === undefined ) return undefined;

				if ( Array.isArray( name ) ) {

					var array = [];

					for ( var i = 0, l = name.length; i < l; i ++ ) {

						var uuid = name[ i ];

						if ( materials[ uuid ] === undefined ) {

							console.warn( 'THREE.ObjectLoader: Undefined material', uuid );

						}

						array.push( materials[ uuid ] );

					}

					return array;

				}

				if ( materials[ name ] === undefined ) {

					console.warn( 'THREE.ObjectLoader: Undefined material', name );

				}

				return materials[ name ];

			}

			switch ( data.type ) {

				case 'Scene':

					object = new Scene();

					if ( data.background !== undefined ) {

						if ( Number.isInteger( data.background ) ) {

							object.background = new Color( data.background );

						}

					}

					if ( data.fog !== undefined ) {

						if ( data.fog.type === 'Fog' ) {

							object.fog = new Fog( data.fog.color, data.fog.near, data.fog.far );

						} else if ( data.fog.type === 'FogExp2' ) {

							object.fog = new FogExp2( data.fog.color, data.fog.density );

						}

					}

					if ( data.transitions !== undefined ) {
						object.transitions = data.transitions;
					}

					break;

				case 'PerspectiveCamera':

					object = new PerspectiveCamera( data.fov, data.aspect, data.near, data.far );

					if ( data.focus !== undefined ) object.focus = data.focus;
					if ( data.zoom !== undefined ) object.zoom = data.zoom;
					if ( data.filmGauge !== undefined ) object.filmGauge = data.filmGauge;
					if ( data.filmOffset !== undefined ) object.filmOffset = data.filmOffset;
					if ( data.view !== undefined ) object.view = Object.assign( {}, data.view );

					break;

				case 'OrthographicCamera':

					object = new OrthographicCamera( data.left, data.right, data.top, data.bottom, data.near, data.far );

					break;

				case 'AmbientLight':

					object = new AmbientLight( data.color, data.intensity );

					break;

				case 'DirectionalLight':

					object = new DirectionalLight( data.color, data.intensity );

					break;

				case 'PointLight':

					object = new PointLight( data.color, data.intensity, data.distance, data.decay );

					break;

				case 'RectAreaLight':

					object = new RectAreaLight( data.color, data.intensity, data.width, data.height );

					break;

				case 'SpotLight':

					object = new SpotLight( data.color, data.intensity, data.distance, data.angle, data.penumbra, data.decay );

					break;

				case 'HemisphereLight':

					object = new HemisphereLight( data.color, data.groundColor, data.intensity );

					break;

				case 'SkinnedMesh':

					console.warn( 'THREE.ObjectLoader.parseObject() does not support SkinnedMesh yet.' );

				case 'Mesh':

					var geometry = getGeometry( data.geometry );
					var material = getMaterial( data.material );

					if ( geometry.bones && geometry.bones.length > 0 ) {

						object = new SkinnedMesh( geometry, material );

					} else {

						object = new Mesh( geometry, material );

					}

					break;

				case 'LOD':

					object = new LOD();

					break;

				case 'Line':

					object = new Line( getGeometry( data.geometry ), getMaterial( data.material ), data.mode );

					break;

				case 'LineLoop':

					object = new LineLoop( getGeometry( data.geometry ), getMaterial( data.material ) );

					break;

				case 'LineSegments':

					object = new LineSegments( getGeometry( data.geometry ), getMaterial( data.material ) );

					break;

				case 'PointCloud':
				case 'Points':

					object = new Points( getGeometry( data.geometry ), getMaterial( data.material ) );

					break;

				case 'Sprite':

					object = new Sprite( getMaterial( data.material ) );

					break;

				case 'Group':

					object = new Group();

					break;

				default:

					object = new Object3D();

			}

			object.uuid = data.uuid;

			if ( data.name !== undefined ) object.name = data.name;
			if ( data.renderOrder !== undefined ) object.renderOrder = data.renderOrder;
			if ( data.matrix !== undefined ) {

				matrix.fromArray( data.matrix );
				matrix.decompose( object.position, object.quaternion, object.scale );

			} else {

				if ( data.position !== undefined ) object.position.fromArray( data.position );
				if ( data.rotation !== undefined ) object.rotation.fromArray( data.rotation );
				if ( data.quaternion !== undefined ) object.quaternion.fromArray( data.quaternion );
				if ( data.scale !== undefined ) object.scale.fromArray( data.scale );

			}

			if ( data.castShadow !== undefined ) object.castShadow = data.castShadow;
			if ( data.receiveShadow !== undefined ) object.receiveShadow = data.receiveShadow;

			if ( data.shadow ) {

				if ( data.shadow.bias !== undefined ) object.shadow.bias = data.shadow.bias;
				if ( data.shadow.radius !== undefined ) object.shadow.radius = data.shadow.radius;
				if ( data.shadow.mapSize !== undefined ) object.shadow.mapSize.fromArray( data.shadow.mapSize );
				if ( data.shadow.camera !== undefined ) object.shadow.camera = this.parseObject( data.shadow.camera );

			}

			if ( data.visible !== undefined ) object.visible = data.visible;
			if ( data.userData !== undefined ) object.userData = data.userData;

			if( data.userData !== undefined && data.userData.type === "audio" ){
				var url = data.userData.url_new;
				var sound = document.createElement("audio");
				sound.src = url;
				sound.setAttribute('crossorigin', 'anonymous');
				sound.onerror = function () {
					sound.setAttribute('network-error', 'true');
				}
				sound.className = object.uuid;
				document.body.appendChild(sound);
			}
			
			if ( data.children !== undefined ) {
				for ( var child in data.children ) {
					let childData = data.children[ child ];
					if(childData.userData !== undefined && childData.userData.subType === "block"){
						var material = getMaterial( childData.material );
						var textParams = childData.userData.textParams;
						
						var height = 30, hover = 30, curveSegments = 3,
							bevelThickness = 2, bevelSize = 1.5, bevelSegments = 3,
							bevelEnabled = true, font = undefined

						var loader = new THREE.FontLoader();
						loader.load( 'examples/fonts/' + textParams.fontFace + '_' + textParams.fontWeight + '.typeface.json', function ( response ) {
							font = response;
							var textGeo = new THREE.TextGeometry( textParams.text, {
								font: font,
								size: textParams.fontSize,
								height: height,
								curveSegments: curveSegments,
								bevelThickness: bevelThickness,
								bevelSize: bevelSize,
								bevelEnabled: bevelEnabled,
								material: 0,
								extrudeMaterial: 0
							});

							textGeo.computeBoundingBox();
							textGeo.computeVertexNormals();

							if ( ! bevelEnabled ) {
								var triangleAreaHeuristics = 0.1 * ( height * size );
								for ( var i = 0; i < textGeo.faces.length; i ++ ) {
									var face = textGeo.faces[ i ];
									if ( face.materialIndex == 1 ) {
										for ( var j = 0; j < face.vertexNormals.length; j ++ ) {
											face.vertexNormals[ j ].z = 0;
											face.vertexNormals[ j ].normalize();
										}
										var va = textGeo.vertices[ face.a ];
										var vb = textGeo.vertices[ face.b ];
										var vc = textGeo.vertices[ face.c ];
										var s = THREE.GeometryUtils.triangleArea( va, vb, vc );
										if ( s > triangleAreaHeuristics ) {
											for ( var j = 0; j < face.vertexNormals.length; j ++ ) {
												face.vertexNormals[ j ].copy( face.normal );
											}
										}
									}
								}
							}
							var textMesh = new THREE.Mesh( textGeo, material );
							matrix.fromArray( childData.matrix );
							matrix.decompose( textMesh.position, textMesh.quaternion, textMesh.scale );
							textMesh.name = childData.name;
							textMesh.renderOrder = childData.renderOrder;
							textMesh.userData = childData.userData;
							textMesh.uuid = childData.uuid;
							editor.scene.add(textMesh);
						});
					}
					else{
						object.add( this.parseObject( childData, geometries, materials ) );
					}    
				}
			}
                
            if( data.userData !== undefined && data.userData.isStereo === true )
            {
                let p = {};
                p.scaleX = p.scaleX || 1;
                p.scaleY = p.scaleY || 0.5;
                p.offsetX = p.offsetX || 0;
                p.offsetY = p.offsetY || 0.5;
                var uvs = object.geometry.faceVertexUvs[0];
                for (let i = 0; data.userData.isStereo && i < uvs.length; i ++) {
                    for (var j = 0; j < 3; j ++) {
                        uvs[i][j].x *= p.scaleX;
                        uvs[i][j].x += p.offsetX;
                        uvs[i][j].y *= p.scaleY;
                        uvs[i][j].y += p.offsetY;
                    }
                }
            }
            
			if ( data.type === 'LOD' ) {

				var levels = data.levels;

				for ( var l = 0; l < levels.length; l ++ ) {

					var level = levels[ l ];
					var child = object.getObjectByProperty( 'uuid', level.object );

					if ( child !== undefined ) {

						object.addLevel( child, level.distance );

					}

				}

			}

			return object;

		};

	}()

} );

var TEXTURE_MAPPING = {
	UVMapping: UVMapping,
	CubeReflectionMapping: CubeReflectionMapping,
	CubeRefractionMapping: CubeRefractionMapping,
	EquirectangularReflectionMapping: EquirectangularReflectionMapping,
	EquirectangularRefractionMapping: EquirectangularRefractionMapping,
	SphericalReflectionMapping: SphericalReflectionMapping,
	CubeUVReflectionMapping: CubeUVReflectionMapping,
	CubeUVRefractionMapping: CubeUVRefractionMapping
};

var TEXTURE_WRAPPING = {
	RepeatWrapping: RepeatWrapping,
	ClampToEdgeWrapping: ClampToEdgeWrapping,
	MirroredRepeatWrapping: MirroredRepeatWrapping
};

var TEXTURE_FILTER = {
	NearestFilter: NearestFilter,
	NearestMipMapNearestFilter: NearestMipMapNearestFilter,
	NearestMipMapLinearFilter: NearestMipMapLinearFilter,
	LinearFilter: LinearFilter,
	LinearMipMapNearestFilter: LinearMipMapNearestFilter,
	LinearMipMapLinearFilter: LinearMipMapLinearFilter
};


export { ObjectLoader };
