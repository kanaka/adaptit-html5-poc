// SelectList: make a linear group of DOM elements mouse/touch selectable
//
// Here is an example:
//
// SelectList('.selectable div',
//            'ui-selecting', 'ui-selected',
//            function (selected) {
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

var select_start = {},
    select_stop = {},
    api = {
        'start' : start,
        'stop'  : stop,
        'clear' : clear
    };


function start () {
    document.addEventListener('mousedown', onMouseDown, false);
    document.addEventListener('mouseup', onMouseUp, false);
    document.addEventListener('mousemove', onMouseMove, false);

    document.addEventListener('touchstart', onTouchStart, false );
    document.addEventListener('touchend', onTouchEnd, false );
    document.addEventListener('touchmove', onTouchMove, false );
}

function stop  () {
    document.removeEventListener('mousedown', onMouseDown, false);
    document.removeEventListener('mouseup', onMouseUp, false);
    document.removeEventListener('mousemove', onMouseMove, false);

    document.removeEventListener('touchstart', onTouchStart, false );
    document.removeEventListener('touchend', onTouchEnd, false );
    document.removeEventListener('touchmove', onTouchMove, false );
}

function clear () {
    var all = $(selector);

    console.log("clearing all select CSS");
    //all.removeClass(css_selecting);
    //all.removeClass(css_selected);
}


function get_selected(event) {
    var items = $(selector);
    for (i=0; i < items.length; i++) {
        var obj = items[i],
            pos = Util.getEventPosition(event, obj);
        if ((pos.x >= 0) &&
            (pos.y >= 0) &&
            (pos.x < obj.clientWidth) &&
            (pos.y < obj.clientHeight)) {
            pos.id = obj.id;
            return pos;
        }
    }
    return null;
}

function slicer(items, start_id, stop_id) {
    var start_index = items.index($("#" + start_id)),
        cur_index = items.index($("#" + stop_id)),
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

    select_stop = {};
    var pos = get_selected(event);
    
    if (pos && pos.id) {
        //console.log("mouse down on " + pos.id + " pos.x: " + pos.x + ", pos.y: " + pos.y);

        select_start = pos;
        select_stop = pos;

        var all = $(selector);
        all.removeClass(css_selecting);
        all.removeClass(css_selected);

        console.log("Adding " + css_selecting + " to " + select_start.id);
        $("#" + select_start.id).addClass(css_selecting);

        Util.stopEvent(event);
    }
}
function onMouseUp (event) {
    //console.log(">> onMouseUp " + event.clientX + "," + event.clientY);

    if (select_start.id) {
        var all = $(selector),
            selected = slicer(all, select_start.id, select_stop.id);

        all.removeClass(css_selecting);
        console.log("Adding " + css_selected + " to multiple");
        selected.addClass(css_selected);

        // If we doing a selection, then ignore the mouse up
        Util.stopEvent(event);

        select_start = select_stop = {};

        callback.call(api, selected);
    }
}
function onMouseMove (event) {
    //console.log(">> onMouseMove " + event.clientX + "," + event.clientY);

    if (select_start.id) {
        var pos = get_selected(event);
        
        if (pos && pos.id && pos.id !== select_stop.id) {
            //console.log("mouse move on " + pos.id + " pos.x: " + pos.x + ", pos.y: " + pos.y);

            select_stop = pos;

            var all = $(selector),
                selected = slicer(all, select_start.id, select_stop.id);

            all.removeClass(css_selecting);
            console.log("Adding " + css_selecting + " to " + select_start.id);
            selected.addClass(css_selecting);
        }
    }
}


function onTouchStart (event) {
    //console.log(">> onTouchStart " + event.touches.length);
    // Just pass through
    onMouseDown(event);
}
function onTouchEnd (event) {
    //console.log(">> onTouchEnd " + event.touches.length);
    // Just pass through
    onMouseUp(event);
}
function onTouchMove (event) {
    //console.log(">> onTouchMove " + event.touches.length);
    onMouseMove(event);
}


// Started by default
start();

// Return the API
return api;
};
