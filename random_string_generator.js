//                                                copyright Seaoak, 2012-2017
//                                                          https://seaoak.jp
//
//  - This program is provided under the MIT License (the X11 License)
//
(function() {
	'use strict';

	//======================================================================
	// utilities
	//======================================================================

	function noopFalse() {
		return false;
	}

	function selectRandomly(candidates) {
		if (! candidates) throw 'invalid argument';
		if (typeof(candidates.length) !== 'number') throw 'invalid argument';
		if (candidates.length <= 0) throw 'invalid argument';
		var index = Math.floor(Math.random() * candidates.length);
		if (typeof(candidates) === 'string') {
			return candidates.charAt(index);
		} else if (typeof(candidates) === 'object') {
			return candidates[index];
		} else {
			throw 'invalid argument';
		}
	}

	function getCharSequence(firstCharacter, length) {
		if (! firstCharacter) throw 'invalid argument';
		if (! length) throw 'invalid argument';
		var code = firstCharacter.charCodeAt(0);
		var list = [];
		for (var i=0; i<length; i++) {
			list.push(code + i);
		}
		return String.fromCharCode.apply(null, list);
	}

	//======================================================================
	// read constraint
	//======================================================================

	function filterToAvoidMisreading(candidates) {
		const elem = document.querySelector('#checkbox_avoid_misreading');
		if (!elem) throw new Error('"#checkbox_avoid_misreading" is not found');
		if (elem.checked) {
			const excludedChars = Array.from(elem.parentNode.innerText.match(/\u2018.\u2019/g))
				.map(str => str.charAt(1))
				.join('');
			if (excludedChars) {
				const regexp = new RegExp('[' + excludedChars + ']', 'g');
				candidates = candidates.replace(regexp, '');
			}
		}
		console.log('DEBUG: candidates = ' + candidates);
		return candidates;
	}

	function filterToAlphabetOnlyAtFirstLast(candidates) {
		const elem = document.querySelector('#checkbox_alphabet_only_at_firstlast');
		if (!elem) throw new Error('"#checkbox_alphabet_only_at_firstlast" is not found');
		if (elem.checked) {
			candidates = candidates.replace(/[^A-Za-z]/g, '');
		}
		console.log('DEBUG: candidates = ' + candidates);
		return candidates;
	}

	function getCandidatesForMiddle() {
		var candidates = '';

		Array.from(document.querySelectorAll('#checkbox_uppercase'))
			.filter(elem => elem.checked)
			.forEach(_ => candidates += getCharSequence('A', 26));
		Array.from(document.querySelectorAll('#checkbox_lowercase'))
			.filter(elem => elem.checked)
			.forEach(_ => candidates += getCharSequence('a', 26));
		Array.from(document.querySelectorAll('#checkbox_number'))
			.filter(elem => elem.checked)
			.forEach(_ => candidates += getCharSequence('0', 10));
		Array.from(document.querySelectorAll('#checkbox_sign'))
			.filter(elem => elem.checked)
			.forEach(_ => {
				Array.from(document.querySelectorAll('#fieldset_sign input'))
					.filter(elem => elem.checked)
					.map(elem => elem.parentNode.innerText.slice(-2, -1)) // only 1 character
					.forEach(s => candidates += s);
			});

		candidates = filterToAvoidMisreading(candidates);

		console.log('DEBUG: candidates = ' + candidates);
		return candidates;
	}

	function getCandidatesForFirst() {
		var candidates = getCandidatesForMiddle();
		candidates = filterToAlphabetOnlyAtFirstLast(candidates);
		console.log('DEBUG: candidates = ' + candidates);
		return candidates;
	}

	function getCandidatesForLast() {
		return getCandidatesForFirst();
	}


	function getCandidatesList(length) {
		var candidatesList = [getCandidatesForFirst()];
		if (length > 1) {
			for (var i=1; i<length-1; i++) {
				candidatesList.push(getCandidatesForMiddle());
			}
			candidatesList.push(getCandidatesForLast());
		}
		return candidatesList;
	}

	//======================================================================
	// update
	//======================================================================

	function generateRandomString(length) {
		const requiredNumberOfNumber = (() => {
			const elem1 = document.querySelector('#checkbox_number_required_at_least');
			if (!elem1) throw new Error('"#checkbox_number_required_at_least" is not found');
			const elem2 = document.querySelector('#checkbox_number');
			if (!elem2) throw new Error('"#checkbox_number" is not found');
			return (elem1.checked && elem2.checked) ? Math.floor(length * 0.1) : 0;
		})();
		let count = 0;
		while (count++ < 100) {
			var result = getCandidatesList(length).map(function(candidates, index) {
				if (! candidates) throw 'ERROR: no candidate.';
				return selectRandomly(candidates);
			}).join('');
			if (result.replace(/[^0-9]/g, '').length < requiredNumberOfNumber) continue; // retry
			return result;
		}
		throw new Error('too many retries');
	}

	function updateResult() {
		const elemOfResult = document.querySelector('#field_result');
		if (!elemOfResult) throw new Error('"#field_result" is not found');
		const elemOfLength = document.querySelector('#field_length');
		if (!elemOfLength) throw new Error('"#field_length" is not found');
		try {
			const length = elemOfLength.value;
			if (!length) throw 'ERROR: invalid length';
			if (!/^[1-9][0-9]*$/.test(length)) throw 'ERROR: invalid length';

			const text = generateRandomString(length);
			elemOfResult.value = text;
			elemOfResult.style.color = '';
			elemOfResult.disabled = false;
			elemOfResult.focus();
			elemOfResult.select();
			console.log('DEBUG: update.');
		} catch(err) {
			console.error(err);
			const text = '' + err;
			elemOfResult.value = text;
			elemOfResult.style.color = 'Red';
			elemOfResult.disabled = true;
			return;
		}
	}

	//======================================================================
	// main
	//======================================================================
	function initialize() {
		Array.from(document.querySelectorAll('#checkbox_sign'))
			.forEach(elem => elem.addEventListener('input', () => {
				Array.from(document.querySelectorAll('#fieldset_sign'))
					.forEach(e => e.disabled = !elem.checked);
				updateResult();
			}));
		const elemOfLength = document.querySelector('#field_length');
		if (!elemOfLength) throw new Error('"#field_length" is not found');
		elemOfLength.addEventListener('input', () => {
			updateResult();
			elemOfLength.focus(); // get focus back
		});
		Array.from(document.querySelectorAll('.button_length'))
			.forEach(elem => elem.addEventListener('click', () => {
				elemOfLength.value = elem.value;
				updateResult();
			}));
		Array.from(document.querySelectorAll('#fieldset_to_narrow input'))
			.forEach(elem => elem.addEventListener('input', () => updateResult()));
		Array.from(document.querySelectorAll('#fieldset_to_widen input'))
			.forEach(elem => elem.addEventListener('input', () => updateResult()));
		Array.from(document.querySelectorAll('#button_refresh'))
			.forEach(elem => elem.addEventListener('click', () => updateResult()));
		const elemOfResult = document.querySelector('#field_result');
		if (!elemOfResult) throw new Error('"#field_result" is not found');
		const selectResult = () => {
			elemOfResult.focus();
			elemOfResult.select();
		};
		elemOfResult.addEventListener('click', () => selectResult());
		Array.from(document.querySelectorAll('#button_selectall'))
			.forEach(elem => elem.addEventListener('click', () => selectResult()));

		updateResult();
		console.log('DEBUG: ready.');
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initialize);
	} else {
		initialize();
	}
})();
