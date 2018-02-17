const spawn = require('child_process').spawn,
    logger = require('simple-node-logger').createSimpleLogger('debug.log'),
    log = logger.info,
    stdin = process.stdin
let once=true
class Spawner{
	constructor(start, options){

		this.options = Object.assign({
			onExitCloseChild:true,
			takeInput:true,
			onExit:function (exitCode, signal) {
			    
			},
			onEnd:function() {
				
			},
			onData:function(data) {
				
			}
		},options)

		if(start===true&&once){
			this.pianobar=spawn('pianobar')
			this.setUpPianobar()
			once=false
		}else{
			this.pianobar=start
		}
		
	}
	setUpPianobar(){
		if(this.options.takeInput){
			// without this, we would only get streams once enter is pressed
			stdin.setRawMode( true );

			// resume stdin in the parent process (node app won't quit all by itself
			// unless an error or process.exit() happens)
			stdin.resume();

			// i don't want binary, do you?
			stdin.setEncoding( 'utf8' );

			// on any data into stdin
			stdin.on( 'data', key =>{
			  // ctrl-c ( end of text )
			  if ( key === '\u0003' ) {
			    process.exit();
			  }

			  //send single char and flush stdin
			  this.pianobar.stdin.write(key+"\n")

			  // write the key to stdout all normal like
			  process.stdout.write(key)
			})
		}
		this.pianobar.stdout.setEncoding('utf8')

		this.pianobar.stdout.on('data', this.options.onData)

		this.pianobar.stdout.on('end', this.options.onEnd)

		this.pianobar.on('exit', this.options.onExit)

		if(this.options.onExitCloseChild){
			process.on('exit', ()=> {
			    this.pianobar.kill()
			})
		}

	}
	getPianobar(){
		return this.pianobar
	}
	respawn(){
		once=true
		//other respawn code
	}
}

module.exports = Spawner