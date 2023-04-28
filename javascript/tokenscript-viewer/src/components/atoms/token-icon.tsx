import {Component, h, JSX, Prop, State, Watch} from "@stencil/core";


@Component({
	tag: 'token-icon',
	styleUrl: 'token-icon.css',
	shadow: true,
})
export class TokenIcon {

	@Prop()
	src: string;

	@Prop()
	imageTitle: string;

	@State()
	image: JSX.Element

	@State()
	loaded = false;

	connectedCallback(){
		this.loadImage();
	}

	@Watch("src")
	private loadImage(){
		let src = this.src
		let image;

		if (src && src !== 'undefined') {
			// Create image elements and add onload/onerror events
			/*image = document.createElement('img')
			image.loading = 'lazy'
			image.addEventListener('load', (e: Event) => {
				this.loaded = true;
			})
			image.addEventListener('error', (e: Event) => {
				this.image = this.createAvatar();
				this.loaded = true;
			})
			image.src = src;*/

			image = (<img alt={this.imageTitle} src={src}
						  onLoad={() => {
							  this.loaded = true;
						  }}
						  onError={(e: Event) => {
							  this.image = this.createAvatar();
							  this.loaded = true;
						  }} />);
		} else {
			image = this.createAvatar()
			this.loaded = true;
		}

		this.image = image;
	}

	private createAvatar() {
		return (
			<img alt={this.imageTitle} src={this.generateAvatar(this.imageTitle)}/>
		)
	}

	private generateAvatar(text: string) {
		const canvas = document.createElement('canvas')
		const context = canvas.getContext('2d')

		canvas.width = 200
		canvas.height = 200

		if (!context) return ''

		context.fillStyle = this.getRandomBackgroundColor()
		context.fillRect(0, 0, canvas.width, canvas.height)
		context.font = "bold 100px 'Arial', sans-serif"
		context.fillStyle = '#fff'
		context.textAlign = 'center'
		context.textBaseline = 'middle'

		let words = text.split(' ')
		let initials = ''

		for (let i = 0; initials.length < 2 && i < words.length; i++) {
			let chars = words[i].split('')
			if (chars.length) initials += chars[0].toUpperCase()
		}

		context.fillText(initials, canvas.width / 2, canvas.height / 2)

		return canvas.toDataURL('image/png')
	}

	// TODO: Generate random colors default icons
	private getRandomBackgroundColor() {
		return '#0029a7'
	}

	render () {
		return (
			<div class={this.loaded ? "" : "shimmer"} title={this.imageTitle}>
				{this.image}
			</div>
		)
	}

}
