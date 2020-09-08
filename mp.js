
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////   INSTANCE VUE   /////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
window.mp = {
	bus: new Vue()
};

window.addEventListener("load", () => {
	console.log("App started !");
	window.mp.app = new Vue({
		el: '#mp'
	});
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////   AUDIO PLAYER   ///////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
Vue.component('player', {
	template: `
	<div class="container d-flex flex-column align-items-center pt-4">

		<div class="d-flex flex-column align-items-center">

			<h1>{{ title }}</h1>
			<h6>{{ subtitle }}</h6>

		</div>

		<div>
			<img :src="'img/' + playingSong.img" alt="image" class="img-fluid" />
		</div>

		<div class="player-controls mb-2 w-100">

			<div class="progress-bar-timer d-flex flex-column">

				<div class="player-progress" title="Timer" @click.prevent="updateSeekPosition">
					<div :style="{ width: this.percentComplete + '%' }" class="player-seeker" title="tps écoulé"></div>
				</div>

				<div class="player-time d-flex justify-content-between align-items-end">
					<div title="Temps écoulé" class="player-time-current">{{ currentTime }}</div>
					<div title="Durée Totale" class="player-time-total">{{ durationTime }}</div>
				</div>

			</div> 

		</div>

		<div class="player-controls buttons d-flex flex-wrap w-100 mt-4">

			<div @click.prevent="backward" class="control">
				<a title="Backward" href="#" class="d-flex justify-content-center">
					<i class="fas fa-step-backward"></i>
				</a>
			</div>

			<div @click.prevent="stopSong" class="control">
			<a title="Stop" href="#" class="d-flex justify-content-center">
				<i class="fas fa-stop"></i>
			</a>
			</div>

			<div @click.prevent="togglePlayingSong" class="control">
			<a :title="playing ? 'Pause' : 'Play'" class="d-flex justify-content-center">
				<i class="fas" :class="{'fa-pause': playing, 'fa-play': !playing}"></i>
			</a>
			</div>

			<div @click.prevent="forward" class="control">
				<a title="Forward" href="#" class="d-flex justify-content-center">
					<i class="fas fa-step-forward"></i>
				</a>
			</div>

			<div @click.prevent="toggleMute" class="control">
			<a :title="muted ? 'Muted' : 'Unmute'" href="#" class="d-flex justify-content-center">
				<i class="fas" :class="{'fa-volume-up': !muted, 'fa-volume-mute': muted}"></i>
			</a>
			</div>

			<div class="volume-bar d-flex control" v-on:mouseenter="showVolume = true">
				<a title="Volume" href="#" class="d-flex justify-content-center align-items-center">
					<i class="fas fa-sliders-h"></i>
					<input  id="volume" class="custom-slider custom-slider-saber ml-2"
							v-show="showVolume" type="range"
							v-on:change="onVolumeChange"
							v-on:mouseout="showVolume = false"
							min="0" max="1" value="1" step="0.1"/>
				</a>
			</div>

		</div>
    </div>
    `,

	data() {
		return {
			title: "Audio Player",
			subtitle: "made with VueJs",
			playingSong: {
				img: "default.jpg" //img au démarrage du player est noir
			}, // song actually being played
			playing: false,
			muted: false,
			currentSeconds: 0,
			durationSeconds: 0,
			showVolume: false,
			previousVolume: 0,
			firstInteraction: false,
			playerAudio: null
		}
	},

	methods: {
		convertTimeHHMMSS(val) {
			let hhmmss = new Date(val * 1000).toISOString().substr(11, 8);
			return hhmmss.indexOf("00:") === 0 ? hhmmss.substr(3) : hhmmss;
		},
		togglePlayingSong() {
			window.mp.bus.$emit(this.playing ? 'pause' : 'play');
		},
		stopSong() {
			window.mp.bus.$emit('stop');
		},
		backward() {
			window.mp.bus.$emit('backward');
		},
		forward() {
			window.mp.bus.$emit('forward');
		},
		toggleMute() {
			this.muted = !this.muted;
		},
		updateSeekPosition(evt) {
			const el = evt.currentTarget.getBoundingClientRect();
			const seekPosition = (evt.clientX - el.left) / el.width;
			this.currentSeconds = this.durationSeconds * seekPosition;
			this.playerAudio.currentTime = this.currentSeconds;
		},
		preventFirstInteraction() { // Prevent Chrome error for autoplay
			this.firstInteraction = true;
			['mousemove', 'scroll', 'keydown', 'click', 'touchstart'].forEach(evt => {
				document.body.removeEventListener(evt, this.preventFirstInteraction);
			});
		},
		onVolumeChange(evt) {
			this.playerAudio.volume = evt.target.value;
		}
	},

	watch: {
		volume(value) {
			this.muted = value === 0;
		},
		muted(value) {
			if (value) {
				this.previousVolume = this.playerAudio.volume;
				this.playerAudio.volume = 0;
			} else {
				this.playerAudio.volume = this.previousVolume;
			}
		}
	},

	computed: {
		currentTime() {
			return this.convertTimeHHMMSS(this.currentSeconds); // 00:00
		},
		durationTime() {
			return this.convertTimeHHMMSS(this.durationSeconds); // 00:00
		},
		percentComplete() {
			return (this.currentSeconds / this.durationSeconds) * 100;
		}
	},

	mounted() {
		this.playerAudio = new Audio();

		this.playerAudio.ontimeupdate = () => {
			this.currentSeconds = this.playerAudio.currentTime;
		};
		this.playerAudio.onloadedmetadata = () => {
			this.durationSeconds = this.playerAudio.duration;
			this.currentSeconds = this.playerAudio.currentTime;
			this.playerAudio.muted = this.muted;
			window.mp.bus.$emit('play');
		};
		this.playerAudio.onended = () => {
			window.mp.bus.$emit("forward");
		};

		window.mp.bus.$on('song', (song) => {
			this.playingSong = song;
			this.playerAudio.src = 'mp3/'.concat(song.src);
		});

		window.mp.bus.$on("play", () => {
			if (this.firstInteraction) {
				this.playing = true; // Affiche icone PLAY
				this.playerAudio.play();
			}
		});

		window.mp.bus.$on('pause', () => {
			this.playing = false;
			this.playerAudio.pause();
		});

		window.mp.bus.$on("stop", () => {
			this.playing = false;
			this.playerAudio.pause();
			this.currentSeconds = this.playerAudio.currentTime = 0;
		});

		['mousemove', 'scroll', 'keydown', 'click', 'touchstart'].forEach(evt => {
			document.body.addEventListener(evt, this.preventFirstInteraction);
		});
	}
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////   PLAYER LIST   ////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
Vue.component('playerlist', {

	template: `
  <div class="playlist container mt-4">
    <ol>
      <li v-for="song in playlist"
      :class="{ currentlyPlayed: song.isActive}"
      @click="clicked(song)">
        {{ song.name }} - <small>{{ song.author }}</small>
      </li>
    </ol>
  </div>
  `,

	data() {
		return {
			playlist: [
				{
					name: "The Imperial March",
					author:"Star Wars",
					src: "Star Wars- The Imperial March.mp3",
					img: "imperial-march.jpg",
					isActive: false,
				},

				{
					name: "March of the Templars",
					author:"Legenda em latim",
					src: "March of the Templars.mp3",
					img: "templar-march.jpg",
					isActive: false,
				},

				{
					name: "Human",
					author:"Rag'n'Bone Man",
					src: "Rag'n'Bone Man - Human.mp3",
					img: "ragnbone.jpg",
					isActive: false,
				},

				{
					name: "Keine Lust",
					author:"Rammstein",
					src: "Rammstein - Keine Lust.mp3",
					img: "rammstein.png",
					isActive: false,
				}
			],
			currentIndexSong: 0
		}
	},

	methods: {
		clicked(song) {
			if (song.isActive === true) {
				song.isActive = false;
			} else {
				song.isActive = !song.isActive;// true
			}
			this.playlist.forEach(el => {
				if (el.name !== song.name) {
					el.isActive = false;
				}
			});
			this.currentIndexSong = this.playlist.findIndex(x => x.name === song.name);
			window.mp.bus.$emit("song", song);
		},
	},

	mounted() {
		// Next song in playlist
		window.mp.bus.$on('forward', () => {
			this.playlist[this.currentIndexSong].isActive = false;
			if (this.currentIndexSong < this.playlist.length - 1) {
				this.currentIndexSong++;
			} else {
				this.currentIndexSong = (this.playlist.length - 1) - this.currentIndexSong;
			}
			this.playlist[this.currentIndexSong].isActive = true;
			window.mp.bus.$emit('song', this.playlist[this.currentIndexSong]);
		});
		// Previous song in playlist
		window.mp.bus.$on('backward', () => {
			this.playlist[this.currentIndexSong].isActive = false;
			if (this.currentIndexSong == 0) {
				this.currentIndexSong = this.playlist.length - 1 ;
			} else {
				this.currentIndexSong--;
			}
			this.playlist[this.currentIndexSong].isActive = true;
			window.mp.bus.$emit('song', this.playlist[this.currentIndexSong]);
		});

		// Run...
		if (this.playlist[0]) {
			this.playlist[0].isActive = true;
			window.mp.bus.$emit('song', this.playlist[0]);
		}

	}
});
