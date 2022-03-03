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
		if ($('#checkbox_avoid_misreading').prop('checked')) {
			var targetList = $('#checkbox_avoid_misreading').parent().text().match(/\u2018.\u2019/g);
			if (! targetList) throw 'unexpected HTML.';
			var excludedCharList = $.map(targetList, function(elem, index) {
				return elem.charAt(1);
			});
			console.log('DEBUG: excludedCharList = ' + excludedCharList.join(':'));
			var regexp = new RegExp('[' + excludedCharList.join('') + ']', 'g');
			candidates = candidates.replace(regexp, '');
		}
		console.log('DEBUG: candidates = ' + candidates);
		return candidates;
	}

	function filterToAlphabetOnlyAtFirstLast(candidates) {
		if ($('#checkbox_alphabet_only_at_firstlast').prop('checked')) {
			candidates = candidates.replace(/[^A-Za-z]/g, '');
		}
		console.log('DEBUG: candidates = ' + candidates);
		return candidates;
	}

	function getCandidatesForMiddle() {
		var candidates = '';

		if ($('#checkbox_uppercase').prop('checked')) {
			candidates += getCharSequence('A', 26);
			console.log('DEBUG: candidates = ' + candidates);
			if (candidates.charAt(candidates.length - 1) !== 'Z') throw 'Assertion failed';
		}

		if ($('#checkbox_lowercase').prop('checked')) {
			candidates += getCharSequence('a', 26);
			console.log('DEBUG: candidates = ' + candidates);
			if (candidates.charAt(candidates.length - 1) !== 'z') throw 'Assertion failed';
		}

		if ($('#checkbox_number').prop('checked')) {
			candidates += getCharSequence('0', 10);
			console.log('DEBUG: candidates = ' + candidates);
			if (candidates.charAt(candidates.length - 1) !== '9') throw 'Assertion failed';
		}

		if ($('#checkbox_sign').prop('checked')) {
			$('#fieldset_sign input').each(function(index, elem) {
				if ($(elem).prop('checked')) {
					var text = $(elem.parentNode).text();
					candidates += text.charAt(text.length - 2);
				}
			});
			console.log('DEBUG: candidates = ' + candidates);
		}

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
		var result = $.map(getCandidatesList(length), function(candidates, index) {
			if (! candidates) throw 'ERROR: no candidate.';
			return selectRandomly(candidates);
		}).join('');
		return result;
	}

	function updateResult() {
		var length = $('#field_length').val();
		if (! length) throw 'ERROR: invalid length';
		if (length < 0) throw 'ERROR: length must be positive';

		var text = '';
		if (! text) {
			try {
				text = generateRandomString(length);
			} catch(err) {
				if ('' + err !== 'ERROR: no candidate.') throw err;
				console.log(err);
				text = '' + err;
				$('#field_result').val(text).css('color', 'Red').prop('disabled', true);
				return;
			}
		}

		$('#field_result').val(text).css('color', '').prop('disabled', false);
		$('#field_result').select();
		console.log('DEBUG: update.');
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
		elemOfLength.addEventListener('input', () => updateResult());
		Array.from(document.querySelectorAll('#fieldset_typical_length button'))
			.forEach(elem => elem.addEventListener('click', () => {
				const length = elem.id.substring('button_length'.length);
				elemOfLength.value = length;
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
