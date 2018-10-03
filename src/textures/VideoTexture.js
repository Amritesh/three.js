import { Texture } from './Texture';
import { _Math } from '../math/Math';

/**
 * @author mrdoob / http://mrdoob.com/
 */

function VideoTexture( video, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy ) {

	Texture.call( this, video, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy );

	this.generateMipmaps = false;

	// Set needsUpdate when first frame is ready

	var scope = this;

	function onLoaded() {
        video.removeEventListener( 'loadeddata', onLoaded, false );
        scope.needsUpdate = true;
	}

    video.addEventListener( 'loadeddata', onLoaded, false );
}


VideoTexture.prototype = Object.assign( Object.create( Texture.prototype ), {
    constructor: VideoTexture,
    isVideoTexture: true,
    update: function () {
        var video = this.image;
        if ( video.readyState >= video.HAVE_CURRENT_DATA ) {
            this.needsUpdate = true;
        }
    },
    toJSON: function ( meta ) {
        
            if ( meta.textures[ this.uuid ] !== undefined ) {
        
                return meta.textures[ this.uuid ];
        
            }
        
            function getDataURL( video ) {
        
                return video.src;
        
            }
        
            var output = {
                metadata: {
                    version: 4.4,
                    type: 'Texture',
                    generator: 'Texture.toJSON'
                },
        
                uuid: this.uuid,
                name: this.name,
        
                mapping: this.mapping,
        
                repeat: [ this.repeat.x, this.repeat.y ],
                offset: [ this.offset.x, this.offset.y ],
                wrap: [ this.wrapS, this.wrapT ],
        
                minFilter: this.minFilter,
                magFilter: this.magFilter,
                anisotropy: this.anisotropy,
        
                flipY: this.flipY
            };
        
            if ( this.image !== undefined ) {
        
                var video = this.image;
        
                if ( video.uuid === undefined ) {
        
                    video.uuid = _Math.generateUUID(); 
        
                }
        
                if ( meta.videos[ video.uuid ] === undefined ) {
        
                    meta.videos[ video.uuid ] = {
                        uuid: video.uuid,
                        url: getDataURL( video )
                    };
        
                }
        
                output.video = video.uuid;
        
            }
        
            meta.textures[ this.uuid ] = output;
        
            return output;
        
    }
});

export { VideoTexture };
