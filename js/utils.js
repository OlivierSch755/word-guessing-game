class Random{
	
	static shuffleArrayInPlace(array) {
		for (let i = array.length - 1; i >= 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[array[i], array[j]] = [array[j], array[i]];
		}
	}
	
	static numberBetweenZeroAnd(max){
		return Math.floor(Math.random() * max);
	}
	
}

function rangeFromZeroTo(N){
	let arr = [];
	for (let i = 0; i < N; i++) {
	   arr.push(i);
	}
	return arr;
}
		


class StyleSetter{
	
	static isAttributeStyleMapSupported(){
		const testElement = document.createElement('div');
		return 'attributeStyleMap' in testElement && typeof testElement.attributeStyleMap.set === 'function';
	}
	
	
	static setMatrixTOM(HTMLelem, css_varname, matrix ){
		HTMLelem.attributeStyleMap.set(css_varname, new CSSMatrixComponent(matrix))
	}
	
	static setMatrixStyle(HTMLelem, css_varname, matrix ){
		HTMLelem.style.setProperty(css_varname, matrix.toString());
	}
	
	static initSelf(){
		if( this.isAttributeStyleMapSupported() ){
			this.setMatrix = this.setMatrixTOM;
		}
		else{
			console.log("not using CSS Typed Object Model")
			this.setMatrix = this.setMatrixStyle;
		}
		return this;
	}
}
StyleSetter.initSelf();	
		
		
export { Random, rangeFromZeroTo, StyleSetter }