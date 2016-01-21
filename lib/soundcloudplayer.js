/**
 * Created by emilsabitov on 06.10.15.
 * TODO черновая версия
 */
	'use strict';
var SCPlayer = (function () {
	var self = this;
	var account_id = "146241295" , tracks = null , next_track_position = 0 , current_track = null , current_status = 0;
	var play_btn , prev_btn , next_btn , title_bar , sound_btn , time_current_bar , time_end_bar , progress_bar_span , progress , volume = 1;
	self.init = function ( play , prev , next , title , sound , time_current , time_end , progress_bar , progressbar_span ) {
		play_btn = play;
		prev_btn = prev;
		next_btn = next;
		title_bar = title;
		sound_btn = sound;
		progress = progress_bar;
		progress_bar_span = progressbar_span;

		time_current_bar = time_current;
		time_end_bar = time_end;
		SC.initialize( {
			client_id : "7766082c5874fb0e4ac75ddab9d1c007" ,
			//redirect_uri : "sc.php" ,
			useHTML5Audio : true ,
			debugMode : true ,
			preferFlash : false ,
			useConsole : true ,
			ignoreMobileRestrictions : true ,
		} );
		SC.get( "/users/" + account_id + "/tracks/" , function ( sound_tracks ) {
			tracks = sound_tracks;
		} );
		play_btn.addEventListener( 'click' , playSound );

		sound_btn.addEventListener( 'click' , setVolume );
		prev_btn.addEventListener( 'click' , prevTrack );
		next_btn.addEventListener( 'click' , nextTrack );
		progress.addEventListener( 'click' , progressBarClick );
		playerWorker();
	};
	var
		progressBarClick = function ( e ) {
			e.stopPropagation();

			if ( current_track && current_track.getState() == "playing" ) {
				//TODO добавить проверку на работу трэка
				var offsetX = e.offsetX ,
					progress_width = $( e.target ).width() ,
					percent = Math.floor( (offsetX * 100) / progress_width ) ,
					track_duration = current_track.getDuration();
				current_track.pause();
				current_track.seek( Math.floor( (track_duration / 100) * percent ) );
				current_track.play();
			}
		} ,
		nextTrack = function ( event ) {
			event.preventDefault();
			getNextTrack();
			return false;
		};
	var prevTrack = function ( event ) {
		event.preventDefault();
		getPrevTrack();
		return false;
	};
	var setVolume = function ( event ) {
		event.preventDefault();
		if ( current_track != null ) {
			if ( current_track.getVolume() == 1 ) {
				current_track.setVolume( 0 );
				volume = 0;
				sound_btn.classList.remove( 'volume_on' );
				sound_btn.classList.add( 'volume_off' );
			} else {
				sound_btn.classList.remove( 'volume_off' );
				sound_btn.classList.add( 'volume_on' );
				current_track.setVolume( 1 );
				volume = 1;
			}
		}
		return false;
	};
	var prepareTime = function ( ms ) {
		var x = ms / 1000;
		var seconds = x % 60;
		x /= 60;
		var minutes = x % 60;
		if ( seconds < 10 ) {
			return Math.round( minutes ) + ":0" + Math.round( seconds );
		} else {
			return Math.round( minutes ) + ":" + Math.round( seconds );
		}
	};
	var playerWorker = function () {
		setInterval( function () {
			if ( current_track == null ) {
				return;
			}
			if ( current_track.getVolume() != volume ) {
				current_track.setVolume( volume );
			}
			$( time_end_bar ).text( prepareTime( current_track.getDuration() ) );
			$( title_bar ).text( tracks[next_track_position - 1].title );
			var state = current_track.getState();
			switch ( state ) {
				case "ended":
				{
					current_track = null;
					getNextTrack();
					break;
				}
				case "playing":
				{
					$( time_current_bar ).text( prepareTime( current_track.getCurrentPosition() ) );

					var percent = Math.floor( (current_track.getCurrentPosition() / current_track.getDuration()) * 100 );

					progress_bar_span.style.width = percent + "%";
					break;
				}
				case "idle" :
				{
					current_track.play();
					break;
				}
				default :
				{
					break;
				}
			}

		} , 999 );
	};


	var getPrevTrack = function () {
		current_track && current_track.stop();
		((next_track_position - 2 ) < 0) ? next_track_position = 0 : (next_track_position = (next_track_position - 2));
		getNextTrack();
	};
	var getNextTrack = function () {
		current_track && current_track.stop();
		if ( tracks.length >= next_track_position ) {
			SC.stream( "/tracks/" + tracks[next_track_position].id , function ( sound ) {
				next_track_position++;
				current_track = sound;
				current_status = 5;
				$( title_bar ).text( tracks[next_track_position - 1].title );
			} );
		} else {
			console.info( "Песни кончились" );
			next_track_position = 0;
		}
	};
	var playSound = function ( event ) {
		event.preventDefault();
		//0 - stop
		//1 - pause
		//5 - play

		switch ( current_status ) {
			case 0:
			{
				if ( tracks.length >= next_track_position ) {
					SC.stream( "/tracks/" + tracks[next_track_position].id , function ( sound ) {
						next_track_position++;
						current_track = sound;
						current_track.play();
						current_status = 5;
						$( title_bar ).text( tracks[next_track_position - 1].title );
						$( play_btn ).removeClass( 'play' ).addClass( 'pause' );

					} );


				} else {
					console.error( "Треков то больше нет!" );
				}
				break;
			}
			case 1:
			{
				current_track && current_track.play();
				current_status = 5;
				$( play_btn ).removeClass( 'play' ).addClass( 'pause' );

				break;
			}
			case 5:
			{
				current_status = 1;
				current_track && current_track.pause();
				$( play_btn ).removeClass( 'pause' ).addClass( 'play' );
				break;
			}
		}
		return false;
	};
	return self;
});