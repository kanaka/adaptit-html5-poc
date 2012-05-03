// SelectList: make a linear group of DOM elements mouse/touch selectable
//
// Here is an example:
//
// SelectList('.selectable div',
//            'ui-selecting', 'ui-selected',
//            function (selected, dblclick) {
//              console.log(selected.length + " elements selected");
//              this.clear();
//            });
//
//
//  - During selection the ui-selecting class will be applied to each
//  - After selection the ui-selected class will be applied to each
//    and the colection of selected elements is passed to the callback
//    which logs the number selected and clears the selection.
//
// Requires jQuery


// Utility functions

Util = {};

// Get DOM element position on page
Util.getPosition = function (obj) {
    var x = 0, y = 0;
    if (obj.offsetParent) {
        do {
            x += obj.offsetLeft;
            y += obj.offsetTop;
            obj = obj.offsetParent;
        } while (obj);
    }
    return {'x': x, 'y': y};
};

// Get mouse event position in DOM element
Util.getEventPosition = function (e, obj, scale) {
    var evt, docX, docY, pos;
    //if (!e) evt = window.event;
    evt = (e ? e : window.event);
    evt = (evt.changedTouches ? evt.changedTouches[0] : evt.touches ? evt.touches[0] : evt);
    if (evt.pageX || evt.pageY) {
        docX = evt.pageX;
        docY = evt.pageY;
    } else if (evt.clientX || evt.clientY) {
        docX = evt.clientX + document.body.scrollLeft +
            document.documentElement.scrollLeft;
        docY = evt.clientY + document.body.scrollTop +
            document.documentElement.scrollTop;
    }
    pos = Util.getPosition(obj);
    if (typeof scale === "undefined") {
        scale = 1;
    }
    return {'x': (docX - pos.x) / scale, 'y': (docY - pos.y) / scale};
};

Util.getSelected = function (event, selector) {
    var items = $(selector);
    for (i=0; i < items.length; i++) {
        var obj = items[i],
            pos = Util.getEventPosition(event, obj);
        if ((pos.x >= 0) &&
            (pos.y >= 0) &&
            (pos.x < obj.clientWidth) &&
            (pos.y < obj.clientHeight)) {
            pos.id = obj.id;
            return obj;
        }
    }
    return null;
}



// Event registration. Based on: http://www.scottandrew.com/weblog/articles/cbs-events
Util.addEvent = function (obj, evType, fn){
    if (obj.attachEvent){
        var r = obj.attachEvent("on"+evType, fn);
        return r;
    } else if (obj.addEventListener){
        obj.addEventListener(evType, fn, false); 
        return true;
    } else {
        throw("Handler could not be attached");
    }
};

Util.removeEvent = function(obj, evType, fn){
    if (obj.detachEvent){
        var r = obj.detachEvent("on"+evType, fn);
        return r;
    } else if (obj.removeEventListener){
        obj.removeEventListener(evType, fn, false);
        return true;
    } else {
        throw("Handler could not be removed");
    }
};

Util.stopEvent = function(e) {
    if (e.stopPropagation) { e.stopPropagation(); }
    else                   { e.cancelBubble = true; }

    if (e.preventDefault)  { e.preventDefault(); }
    else                   { e.returnValue = false; }
};



function SelectList (selector, css_selecting, css_selected, callback) {

var select_start = null,
    select_stop = null,
    isMouseDown = false,
    api = {
        'start' : start,
        'stop'  : stop,
        'clear' : clear
    };


function start () {
    document.addEventListener('mousedown', onMouseDown, false);
    document.addEventListener('mouseup', onMouseUp, false);
    document.addEventListener('dblclick', onMouseDblClick, false);
    document.addEventListener('mousemove', onMouseMove, false);

    document.addEventListener('touchstart', onTouchStart, false );
    document.addEventListener('touchend', onTouchEnd, false );
    document.addEventListener('touchmove', onTouchMove, false );
}

function stop  () {
    document.removeEventListener('mousedown', onMouseDown, false);
    document.removeEventListener('mouseup', onMouseUp, false);
    document.removeEventListener('dblclick', onMouseDblClick, false);
    document.removeEventListener('mousemove', onMouseMove, false);

    document.removeEventListener('touchstart', onTouchStart, false );
    document.removeEventListener('touchend', onTouchEnd, false );
    document.removeEventListener('touchmove', onTouchMove, false );
}

function clear () {
    var all = $(selector);

    select_start = select_stop = null;

    all.removeClass(css_selecting);
    all.removeClass(css_selected);
}


function slicer(items, start, stop) {
    var start_index = items.index($(start)),
        cur_index = items.index($(stop)),
        tmp;

    // Order them
    if (start_index > cur_index) {
        tmp = start_index;
        start_index = cur_index;
        cur_index = tmp;
    }

    return items.slice(start_index, cur_index+1);
}

//
//
//

function onMouseDown (event) {
    //console.log(">> onMouseDown ");

    isMouseDown = true;

    select_stop = null;
    var obj = Util.getSelected(event, selector);
    
    if (obj) {
        select_start = obj;
        select_stop = obj;

        var all = $(selector);
        all.removeClass(css_selecting);
        all.removeClass(css_selected);

        $(select_start).addClass(css_selecting);

        Util.stopEvent(event);
    }
}
function onMouseUp (event, dblclick) {
    //console.log(">> onMouseUp " + event.clientX + "," + event.clientY);
    
    var dblclick = dblclick || false;

    isMouseDown = false;

    if (select_start) {
        var all = $(selector),
            selected = slicer(all, select_start, select_stop);

        all.removeClass(css_selecting);
        selected.addClass(css_selected);

        // If we doing a selection, then ignore the mouse up
        Util.stopEvent(event);

        //select_start = select_stop = null;

        callback.call(api, selected, dblclick);
    }
}
function onMouseDblClick (event) {
    //console.log(">> onMouseDblClick " + event.clientX + "," + event.clientY);

    onMouseUp(event, true);
}

function onMouseMove (event) {
    //console.log(">> onMouseMove " + event.clientX + "," + event.clientY);

    if (select_start && isMouseDown) {
        var obj = Util.getSelected(event, selector);
        
        if (obj && obj.id !== select_stop.id) {
            select_stop = obj;

            var all = $(selector),
                selected = slicer(all, select_start, select_stop);

            all.removeClass(css_selecting);
            selected.addClass(css_selecting);
        }
    }
}


function onTouchStart (event) {
    //console.log(">> onTouchStart " + event.touches.length);

    // Just pass through
    onMouseDown(event);
}

var onTouchEnd_lastTouch = null;
function onTouchEnd (event) {
    //console.log(">> onTouchEnd " + event.touches.length);

    // First pass through as normal mouse up event
    // Then check if it was a double click

    onMouseUp(event);

    // Treat double tap as DoubleClick
    var now = new Date().getTime();
    var lastTouch = onTouchEnd_lastTouch || now + 1;
    /* the first time delta will be a negative number */
    var delta = now - lastTouch;
    if(delta < 500 && delta > 0){
        onMouseDblClick(event);
    }
    onTouchEnd_lastTouch = now;

}
function onTouchMove (event) {
    //console.log(">> onTouchMove " + event.touches.length);

    // Just pass through
    onMouseMove(event);
}


// Started by default
start();

// Return the API
return api;
};
