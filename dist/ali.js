/*!
 * --------------------------------------------------------------------------
 * Ali - Accessible Learning Interactions (
 * Copyright 2016 Jer Brand / Irresponsible Art
 * Licensed GPL (https://github.com/aut0poietic/ali/blob/master/LICENSE)
 * --------------------------------------------------------------------------
 */
window.ali = {
	EVENT : {
		ready    : 'ali:ready',
		complete : 'ali:complete'
	},

	STATUS : {
		complete      : 'complete',
		correct       : 'correct',
		incorrect     : 'incorrect',
		unanticipated : 'unanticipated',
		incomplete    : 'incomplete'
	},

	TYPE : {
		choice      : 'choice',
		performance : 'performance',
		sequencing  : 'sequencing',
		numeric     : 'numeric',
		other       : 'other'
	},
	Interaction : null
};

jQuery( function ( $ ) {
	"use strict";
	if ( window.aliAutolInit !== false ) {
		$( '[data-ali="accordion"]' ).accordion();
	}
} );
;
/*
 * --------------------------------------------------------------------------
 * Ali: aria.es6
 * Licensed GPL (https://github.com/aut0poietic/ali/blob/master/LICENSE)
 * --------------------------------------------------------------------------
 *
 * jQuery.aria
 * A simple jQuery plugin that helps quickly and easily add aria roles, states and properties
 * to any jQuery-wrapped DOM element or collection. A fairly thin wrapper around jQuery's
 * <code>attr()</code>, the aria method restricts property values to current aria properties,
 *
 * Also, you don't have to type "aria-" all the time ;)
 *
 * Example:
 *
 * $('ul.tab-container').aria( 'role', 'tablist' );
 *
 * $('li.tab').aria( {
 *      'role' : 'tab',
 *      'selected' : 'false',
 *      'expanded' : 'false',
 *      'tabindex' : -1
 * } );
 */
///TODO: Extend behavior to allow for near-automatic component creation such as:
///TODO: $('li.tab').aria.init('tab') ;
///TODO: Allow for overridding the defaults, like
///TODO: $('li.tab:first').aria.init('tab', {'selected' : true, 'expanded' : 'true', 'tabindex' : 0 }


(function ( $ ) {
	"use strict";
	var _attrs = [
		'role',
		'tabindex',
		'activedescendant',
		'atomic',
		'autocomplete',
		'busy',
		'checked',
		'controls',
		'describedby',
		'disabled',
		'dropeffect',
		'expanded',
		'flowto',
		'grabbed',
		'haspopup',
		'hidden',
		'invalid',
		'label',
		'labelledby',
		'level',
		'live',
		'multiline',
		'multiselectable',
		'orientation',
		'owns',
		'posinset',
		'pressed',
		'readonly',
		'relevant',
		'required',
		'selected',
		'setsize',
		'sort',
		'valuemax',
		'valuemin',
		'valuenow',
		'valuetext'
	];

	function _addARIA( prop ) {
		prop = ('' + prop).toLowerCase().trim();
		return ( prop !== 'role' && prop !== 'tabindex' ) ? 'aria-' + prop : prop;
	}

	function _isValidAria( prop ) {
		return _attrs.indexOf( prop ) > - 1;
	}

	$.fn.aria = function ( prop, value ) {
		if ( 'object' === $.type( prop ) ) {
			for ( var i in prop ) {
				if ( prop.hasOwnProperty( i ) ) {
					this.aria( i, prop[ i ] );
				}
			}
		} else if ( undefined !== prop && undefined !== value ) {
			this.each( function () {
				if ( _isValidAria( prop ) ) {
					var $el = $( this );
					var attr = _addARIA( prop );
					$el.attr( attr, value );
				}
			} );
		} else if ( undefined !== prop ) {
			return this.attr( _addARIA( prop ) );
		}
		return this;
	};
})( jQuery );
;
(function ( $ ) {
	"use strict";

	// Make the global object available and abort if this file is used without it.
	var ali = window.ali;
	if( $.type( ali ) !== 'object'){
		return ;
	}

	/**
	 *  The parent class for all interactions.
	 * @param element : DOMElement
	 * @param type : string
	 * @param description : string
	 * @constructor
	 */
	ali.Interaction = function ( element, type, description ) {
		this.$el = $( element );
		if ( 'string' === $.type( type ) ) {
			this.data.type = type;
		}
		if ( 'string' === $.type( description ) ) {
			this.data.description = description;
		}
	};

	/**
	 * Event data sent with each event.
	 * @type {{id: string, start: number, type: string, correct_responses: Array, learner_response: Array, result: string, latency: number, description: string}}
	 */
	ali.Interaction.prototype.data = {
		'id'                : '',
		'start'             : 0,
		'type'              : ali.TYPE.other,
		'correct_responses' : [],
		'learner_response'  : [],
		'result'            : ali.STATUS.incomplete,
		'latency'           : 0,
		'description'       : 'Ali Interaction'
	};

	/**
	 *
	 * @type {number}
	 * @private
	 */
	ali.Interaction.prototype.__last = 0;

	/**
	 * Utility function that creates an ID using the the ID of the passed element or the text of the passed element.
	 * @param $el Element used to define the ID.
	 * @returns {string} Target ID for use with `aria-controls`
	 */
	ali.Interaction.prototype.makeTargetID = function ( $el ) {
		var str = $el.attr( 'id' );
		if ( str === undefined ) {
			str = $el.text().replace( /[\W_]+/g, "" ).toLowerCase();
			if ( str.length > 10 ) {
				str = str.substring( 0, 10 );
			}
		} else {
			str += '-target';
		}
		return str;
	};

	/**
	 * Allows a method to be called later, just before the next UI paint.
	 * @param callback
	 */
	ali.Interaction.prototype.defer = function ( callback ) {
		var func = function () {
			callback.apply( this );
		};
		requestAnimationFrame( func.bind( this ) );
	};

	/**
	 * Allows interactions to set their learner responses for this interaction.
	 * @param responses : array An array of responses specific to the interaction
	 */
	ali.Interaction.prototype.setLearnerResponses = function ( responses ) {
		if ( 'array' === $.type( responses ) ) {
			this.data.learner_response = responses;
		}
	};

	/**
	 * Allows interactions to set their correct responses for this interaction.
	 * @param responses : array An array of responses specific to the interaction
	 */
	ali.Interaction.prototype.setCorrectResponses = function ( responses ) {
		if ( 'array' === $.type( responses ) ) {
			this.data.correct_responses = responses;
		}
	};

	/**
	 * Complete event. Fired when all unique user actions have been performed for this interaction.
	 * This could be once all items have been viewed, or when the question or questions have been judged.
	 * @param status : string From the ali.STATUS constant; Should indicate the status of the interaction, including
	 * correct or incorrect, if appropriate.
	 */
	ali.Interaction.prototype.complete = function ( status ) {
		var e, d = new Date();
		if ( 'undefined' === $.type( status ) || '' === status.trim() ) {
			status = 'complete';
		}
		this.data.result = status;
		this.data.latency = d.getTime() - this.data.start;
		e = new jQuery.Event( 'ali:complete' );
		this.$el.trigger( e, [ this.data ] );
	};

	/**
	 * Event trigger method to indicate that an item has been selected.
	 * @param $item : jQuery object for the element selected.
	 */
	ali.Interaction.prototype.itemSelected = function ( $item ) {
		console.log( this.$el.trigger, this.$el );
		var e = new jQuery.Event( 'ali:itemSelected' );
		this.$el.trigger( e, [ this.data, $item ] );
	};

	/**
	 * Event trigger method to indicate that an item has been completed.
	 * @param status : string From the ali.STATUS constant; Should indicate the status of the interaction, including
	 * correct or incorrect, if appropriate.
	 * @param $item : jQuery object for the element selected.
	 */
	ali.Interaction.prototype.itemComplete = function ( status, $item ) {
		if ( 'undefined' === $.type( status ) || '' === status.trim() ) {
			status = ali.STATUS.complete;
		}
		if ( 'undefined' === $.type( $item ) || 0 === $item.length ) {
			$item = this.$el;
		}
		var clonedData = Object.assign( {}, this.data );
		var d = new Date();
		var e = new jQuery.Event( 'ali:itemComplete' );
		clonedData.result = status;
		clonedData.latency = d.getTime() - this.__last;
		this.__last = d.getTime();
		this.$el.trigger( e, [ clonedData, $item ] );
	};

})( jQuery );
;
(function ( $ ) {
	"use strict";

	// Make the global object available and abort if this file is used without it.
	var ali = window.ali;
	if( $.type( ali ) !== 'object'){
		return ;
	}

	var DESCRIPTION = 'Accordion interaction.';
	var TYPE = ali.TYPE.other;

	/*
	 * Saved queries
	 */
	var TAB = '.accordion-tab';
	var OPEN_TAB = '.accordion-tab[aria-expanded="true"]';
	var PANEL = '.accordion-panel';

	/**
	 * Accordion Interaction
	 * @param element DOMElement
	 * @constructor
	 */
	ali.Accordion = function ( element ) {
		ali.Interaction.call( this, element, TYPE, DESCRIPTION );
		this.init();
	};

	// Inherits from ali.Interaction
	ali.Accordion.prototype = Object.create( ali.Interaction.prototype );
	ali.Accordion.prototype.constructor = ali.Accordion;

	/**
	 * Saved jQuery reference to the tabs in this interaction.
	 * @type {jQuery}
	 */
	ali.Accordion.prototype.$tabs = undefined;

	/**
	 * Initilizes the Interaction. Called from contstructor.
	 */
	ali.Accordion.prototype.init = function () {
		var $initOpen = $( OPEN_TAB );
		this.$tabs = $( TAB, this.$el );
		this.$tabs.each( this.initTab.bind( this ) );
		// If there was an expanded tab set by the user, expand that tab.
		// Otherwise, just make the first element in the list active
		if ( $initOpen.length > 0 ) {
			/// DIRTY HACK: deferring this "show" call so that event handlers have a chance to be attached
			/// before it fires.
			this.defer( (function () {
				this.show( $( $initOpen[ 0 ] ) );
			}).bind( this ) );
		} else {
			this.getFirstTab().aria( 'tabindex', 0 );
		}
		// set a debounced resize event handler.
		$( window ).on( 'resize', this._requestResize.bind( this ) );
	};

	/**
	 * jQuery each callback; Initializes the tab/panel pair
	 * @param i : {number} index of current element
	 * @param el {jQuery} tab to operate on.
	 */
	ali.Accordion.prototype.initTab = function ( i, el ) {
		var $tab, $panel, id;
		$tab = $( el );
		id = this.makeTargetID( $tab );
		$panel = $tab.next( PANEL );
		$tab.aria(
			{
				'role'     : "tab",
				'tabindex' : "0",
				'expanded' : "false",
				'controls' : id
			} )
		    .off( 'click.ali' ).on( 'click.ali', this.tab_onClick.bind( this ) )
		    .off( 'keydown.ali' ).on( 'keydown.ali', this.tab_onKeyDown.bind( this ) );

		$panel.aria(
			{
				'role'     : "tabpanel",
				'tabindex' : "-1",
				'hidden'   : "true"
			}
		).attr(
			{
				'id'          : id,
				'data-height' : this._getMeasuredHeight( $panel )
			}
		).off( 'keydown.ali' ).on( 'keydown.ali', this.panel_onKeyDown.bind( this ) );
	};

	/**
	 * Hides the panel corresponding to the provided tab and sets that tab to unexpanded.
	 * @param $tab
	 */
	ali.Accordion.prototype.hide = function ( $tab ) {
		this.getPanelFromTab( $tab ).aria(
			{
				'hidden'   : 'true',
				'tabindex' : "-1"
			}
		).removeAttr( 'style' );
		$tab.aria( 'expanded', 'false' );
	};

	/**
	 *  Hides all panels
	 */
	ali.Accordion.prototype.hideAll = function () {
		this.$tabs.each( (function ( i, el ) {
			this.hide( $( el ) );
		} ).bind( this ) );
	};

	/**
	 * Shows the panel corresponding to the provided $tab and fires an `ali:itemSelected`.
	 * If all tabs have been viewed, fires an `ali:complete` event.
	 * @param $tab
	 */
	ali.Accordion.prototype.show = function ( $tab ) {
		var $panel = this.getPanelFromTab( $tab );
		var panelHeight = parseInt( $panel.attr( 'data-height' ) );
		this.hideAll();
		$panel.aria(
			{
				'hidden'   : 'false',
				'tabindex' : "0"
			}
		);
		if ( panelHeight > 0 ) {
			$panel.css( 'max-height', panelHeight + 'px' );
		}
		$tab.aria(
			{
				'expanded' : 'true',
				'selected' : 'true',
				'tabindex' : '0'
			}
		).addClass( 'viewed' ).focus();

		this.itemSelected( $tab );

		if ( $( '.viewed', this.$el ).length === this.$tabs.length && this.data.result === ali.STATUS.incomplete ) {
			this.complete();
		}
	};

	/**
	 * Returns a panel controlled by the provided tab.
	 * @param $tab : jQuery
	 * @returns jQuery object for the panel.
	 */
	ali.Accordion.prototype.getPanelFromTab = function ( $tab ) {
		return $( '#' + $tab.aria( 'controls' ) );
	};

	/**
	 * Returns a tab that controls the provided panel.
	 * @param $panel : jQuery
	 * @returns jQuery object for the tab
	 */
	ali.Accordion.prototype.getTabFromPanel = function ( $panel ) {
		return $( TAB + '[aria-controls="' + $panel.attr( 'id' ) + '"]' );
	};


	/**
	 * Iterates through all siblings following the provided tab until another tab is found.
	 * If no tab is found, returns an empty jQuery object.
	 * @param $tab
	 * @returns {jQuery}
	 * @note Maximum iterations is 2 * {number of tabs}
	 * @private
	 */
	ali.Accordion.prototype._nextTab = function ( $tab ) {
		var $next = $tab.next();
		var count = this.$tabs.length * 2;
		while ( $next.length > 0 && ! $next.is( TAB ) && count -- !== 0 ) {
			$next = $next.next();
		}
		return $next;
	};

	/**
	 * Returns the next tab in the accordion or the first tab if no next tab can be found.
	 * @param $tab
	 * @returns {jQuery}
	 */
	ali.Accordion.prototype.getNextTab = function ( $tab ) {
		var $next = this._nextTab( $tab );
		if ( $next.length === 0 ) {
			return this.getFirstTab();
		} else {
			return $next;
		}
	};


	/**
	 * Iterates over all siblings preceding the provided tab until another tab is found.
	 * If no tab is found, returns an empty jQuery object.
	 * @param $tab
	 * @returns {jQuery}
	 * @note Maximum iterations is 2 * {number of tabs}
	 * @private
	 */
	ali.Accordion.prototype._previousTab = function ( $tab ) {
		var $prev = $tab.prev();
		var count = this.$tabs.length * 2;
		while ( $prev.length > 0 && ! $prev.is( TAB ) && count -- !== 0 ) {
			$prev = $prev.prev();
		}
		return $prev;
	};

	/**
	 * Returns the previous tab in the accordion or the last tab if no previous tab can be found.
	 * @param $tab
	 * @returns {jQuery}
	 */
	ali.Accordion.prototype.getPreviousTab = function ( $tab ) {
		var $prev = this._previousTab( $tab );
		if ( $prev.length === 0 ) {
			return this.getLastTab();
		} else {
			return $prev;
		}
	};


	/**
	 * Gets the first tab in the list.
	 * @returns {jQuery}
	 */
	ali.Accordion.prototype.getFirstTab = function () {
		return this.$tabs.first();
	};

	/**
	 * Gets the last tab in the list.
	 * @returns {jQuery}
	 */
	ali.Accordion.prototype.getLastTab = function () {
		return this.$tabs.last();
	};


	/**
	 * Keyboard event handler for when keyboard focus in on the tabs.
	 * @private
	 */
	ali.Accordion.prototype.tab_onKeyDown = function ( e ) {
		switch ( e.which ) {
			case 13: // ENTER
			case 32: // SPACE
				e.preventDefault();
				e.stopPropagation();
				this.tab_onClick( e );
				break;
			case 37: // LEFT
			case 38: // UP
				e.preventDefault();
				e.stopPropagation();
				this.show( this.getPreviousTab( $( e.currentTarget ) ) );
				break;
			case 39: // RIGHT
			case 40: // DOWN
				e.preventDefault();
				e.stopPropagation();
				this.show( this.getNextTab( $( e.currentTarget ) ) );
				break;
			case 35: // END
				e.preventDefault();
				e.stopPropagation();
				this.show( this.getLastTab() );
				break;
			case 36: // HOME
				e.preventDefault();
				e.stopPropagation();
				this.show( this.getFirstTab() );
				break;
		}
	};


	/**
	 * Tab click event
	 * @private
	 */
	ali.Accordion.prototype.tab_onClick = function ( e ) {
		var $target = $( e.target );
		if ( $target.aria( 'expanded' ) !== 'true' ) {
			this.hideAll();
			this.show( $target );
		} else {
			this.hide( $target );
		}
	};


	/**
	 * Keyboard event handler for when keyboard focus is in a panel.
	 * @private
	 */
	ali.Accordion.prototype.panel_onKeyDown = function ( e ) {
		if ( (e.ctrlKey || e.metaKey) && e.currentTarget ) {
			var $tab, $newTab;
			var $panel = $( e.currentTarget );
			switch ( e.which ) {
				case 38: // UP
					e.preventDefault();
					e.stopPropagation();
					this.getTabFromPanel( $panel ).focus();
					break;
				case 33: // PAGE UP
					e.preventDefault();
					e.stopPropagation();
					$tab = this.getFirstTab();
					if ( $tab.aria( 'expanded' ) === 'false' ) {
						this.show( $tab );
					}
					$tab.focus();
					break;
				case 40: //  DOWN
					e.preventDefault();
					e.stopPropagation();
					$tab = this.getLastTab();
					if ( $tab.aria( 'expanded' ) === 'false' ) {
						this.show( $tab );
					}
					$tab.focus();
					break;
			}
		}
	};


	/**
	 * Window resize handler.
	 * @param e
	 */
	ali.Accordion.prototype.onResize = function ( e ) {
		this._width = $( document ).width();
		this._requestResize();
	};

	/**
	 * Requests a resize event if the current control is not currently performing a resize event.
	 * Events are handled before the next paint and debounced using requestAnimationFrame
	 * @private
	 */
	ali.Accordion.prototype._requestResize = function () {
		if ( ! this._resizing ) {
			requestAnimationFrame( this._resizePanels.bind( this ) );
			this._resizing = true;
		}
	};

	/**
	 * Callback passed to requestAnimationFrame; sets the max-height for each panel, adjusting the height
	 * for any panel currently open.
	 * @private
	 */
	ali.Accordion.prototype._resizePanels = function () {
		this.$tabs.each( (function ( i, el ) {
			var $panel = $( el ).next( PANEL );
			$panel.attr( 'data-height', this._getMeasuredHeight( $panel ) );
			if ( $panel.aria( 'hidden' ) === 'false' ) {
				$panel.css( 'min-height', this._getMeasuredHeight( $panel ) + 'px' );
			}
		}).bind( this ) );
		this._resizing = false;
	};

	/**
	 * Creates an clone element on the DOM of the provided panel and measures it's height.
	 * @param $panel
	 * @returns {int} height of element
	 * @private
	 */
	ali.Accordion.prototype._getMeasuredHeight = function( $panel ) {
		var $div = $( '<div id="ali-temp" aria-hidden="true" style="overflow:hidden;height:1px;width:100%;visibility: hidden"></div>' ).appendTo( this.$el );
		var $tmp = $( '<dd class="accordion-panel"></dd>' ).html( $panel.html() ).appendTo( $div );
		var h = $tmp.height();
		$div.remove();
		return h;
	};

	/*
	 * jQuery Plugin methods -- shamelessly inspired by Bootstrap because I didn't want to think about it.
	 */
	function Plugin() {
		return this.each( function () {
			new ali.Accordion( this );
		} );
	}

	var old = $.fn.accordion;
	$.fn.accordion = Plugin;
	$.fn.accordion.Constructor = ali.Accordion;

	$.fn.accordion.noConflict = function () {
		$.fn.accordion = old;
		return this;
	};

})( jQuery );