var next_pile_idx = 0, next_strip_idx = 0;

function load_file(file, callback) {
    var reader = new FileReader();

    // Closure to capture the file information.
    reader.onload = (function(theFile) {
        return function(e) {
            //console.log("Loaded file: " + theFile.name);
            callback(e.target.result);
        };
    })(file);

    // Read in the image file as a data URL.
    reader.readAsText(file);
}

function create_pile(source_text, target_text) {
    var pile, source, target, edit;

    pile = document.createElement('div');
    pile.id = "pile-" + next_pile_idx;
    pile.className = "pile";

    source = document.createElement('div');
    source.id = "source-" + next_pile_idx;
    source.className = 'source';
    source.innerHTML = source_text;
    pile.appendChild(source);

    target = document.createElement('div');
    target.id = "target-" + next_pile_idx;
    target.className = 'target';
    pile.appendChild(target);

    edit = document.createElement('input');
    edit.id = "target-edit-" + next_pile_idx;
    edit.className = "target-edit";
    edit.type = "text";
    edit.value = target_text;
    edit.size = target_text.length + 2;

    // Allow clicking directly on the input box
    edit.addEventListener("mousedown", function (event) {
        //console.log('mousedown on ' + edit.id);
        Util.stopPropagation(event);
    }, false);
    edit.addEventListener("keydown", function (event) {
        if ((event.keyCode === 9) ||
            (event.keyCode === 13)) {
            var next_edit = null;
            // If tab/enter is pressed, blur and move to edit the next pile
            Util.stopEvent(event);
            edit.blur();

            if (event.shiftKey) {
                next_edit = pile.previousSibling;
                if (next_edit.id.substr(0,4) !== "pile") {
                    // Probably a header
                    next_edit = null;
                }
            } else {
                next_edit = pile.nextSibling;
            }
            if (next_edit) {
                //console.log("next edit: " + next_edit.id);
                // Do it in a new execution context for iOS
                //setTimeout(function () { edit_pile(next_edit); }, 10);
                edit_pile(next_edit);
            }
        }
    }, false);
    edit.onblur = function () {
        // Reset the input box to plain text
        var new_ttext = edit.value;
        //console.log("new_ttext.length: " + new_ttext.length);

        edit.size = new_ttext.length;
    }
    target.appendChild(edit);

    next_pile_idx++;
    return pile;
}

function add_strip(into, title, source_words, target_words) {
    var id = "strip-" + next_strip_idx,
        strip, header, pile, i;

    strip = document.createElement('div');
    strip.id = id;
    strip.className = "strip";
    next_strip_idx++;

    header = document.createElement('div');
    header.id = id + "-header";
    header.className = "strip-header";
    header.innerHTML = title;
    strip.appendChild(header);

    for (i = 0; i < source_words.length; i++) {
        var source_word = source_words[i];
        var target_word = target_words[i];
        if (typeof(target_word) === "undefined") {
            target_word = "*" + source_word + "*";
        }
        var pile = create_pile(source_word, target_word);
        strip.appendChild(pile);
    }

    document.getElementById(into).appendChild(strip);

    // Activate select list for this strip
    strip.selectlist = SelectList('#' + id + ' .pile',
                                  'ui-selecting',
                                  'ui-selected',
                                  {callback: handle_select,
                                   longclick_time: 333});
}

function edit_pile (pile) {
    var edit = $(".target .target-edit", pile)[0];

    //console.log("editing " + pile.id);

    //setTimeout(function () { edit.focus(); }, 20);
    //edit.select();
    edit.setSelectionRange(0, 9999);
    edit.focus();
}

function handle_select(selected, dblclick, longclick) {
    //console.log(">> handle_select: " + selected.length);

    var strip = selected[0].parentNode;

    /*
    if (pile_edit) {
        pile_edit.blur();
    }
    */

    if (selected.length === 1) {
        if (longclick) {
            // Long click to edit pile
            
            edit_pile(selected[0]);

        } else if (dblclick) {
            // Split one pile

            var cur_box = selected[0], new_box,
                strip = cur_box.parentNode,
                src = $('#' + cur_box.id + " .source")[0],
                swords = src.innerHTML.split(" "),
                tgt = $('#' + cur_box.id + " .target")[0];

            // Split based on source words
            // Put all target words in the first pile
            if (swords.length > 1) {
                src.innerHTML = swords[0];

                for (i = swords.length - 1; i > 0; i--) {
                    new_box = create_pile(swords[i], "");
                    strip.insertBefore(new_box, cur_box.nextSibling);
                }
            }
        } else if (!dblclick) {
            // Single pile clicked/selected

            //console.log("Selected " + selected[0].id);

        }

    } else if (selected.length > 1) {
        // Join multiple piles

        var first = selected[0],
            smsg, tmsg, new_pile;

        // Join source and target words into one new pile
        smsg = $.map(selected, function (o) {
            return $("#" + o.id + " .source").text();
        }).join(" ");
        tmsg = $.map(selected, function (o) {
            return $("#" + o.id + " .target .target-edit")[0].value;
        }).join(" ");

        new_pile = create_pile(smsg, tmsg);
        $(first).before(new_pile);

        // Remove all prior selected piles
        for (i = 0; i < selected.length; i++ ) {
            strip.removeChild(selected[i]);
        }

    }

    if (selected.length !== 1) {
        this.clear();
    }
}


// The above routines are fairly generic. The below routines are
// a bit more specific to the current demo.

function reset_chapter() {
    // Reset the rendered piles and counters
    $('#chapter')[0].innerHTML = "";
    next_pile_idx = 0;
    next_strip_idx = 0;
}

function replace_source_text(text) {
    var source_text, verses, i, pre, vidx, vtxt;

    reset_chapter();

    // Remove newlines
    source_text = text.replace(/ *\n/g, '');
    // Remove multiple spaces
    source_text = source_text.replace(/   */g, ' ');
    // Split on numbers
    verses = source_text.match(/\d\d* [^\d][^\d]*/g);

    for (i = 0; i < verses.length; i++) {
        // Make sure we start with a number
        pre = verses[i].match(/^\d\d* /);
        if (!pre) {
            console.error("Invalid verse: " + verses[i]);
            break;
        }
        // Parse out the verse number and 
        vidx = parseInt(pre[0], 10);
        vtxt = verses[i].substr(pre[0].length);

        // Remove leading/trailing spaces
        vtxt = vtxt.replace(/^ */, '');
        vtxt = vtxt.replace(/ *$/, '');

        add_strip("chapter", vidx, vtxt.split(' '), []);
    }
}

function get_data() {
    // [{title: "", source_words: [], target_words: []]},
    var data = [], header, source_words, target_words;
    $("#chapter .strip").each(function (i, strip) {
        header = $(".strip-header", strip)[0];
        source_words = [];
        target_words = [];
        $("#" + strip.id + " .pile").each(function (i, pile) {
            source_words.push($(".source", pile)[0].innerHTML);
            target_words.push($(".target-edit", pile)[0].value);
        });
        data.push({title: header.innerHTML,
                   source_words: source_words,
                   target_words: target_words});
    });
    return data;
}

function set_data(data) {
    reset_chapter();
    $.each(data, function (i, strip) {
        add_strip("chapter", strip.title, strip.source_words, strip.target_words);
    });
}

//
// I/O routines

function load_source_url(url) {
    $.ajax({url: "verses.txt",
            success: function (data) {
                replace_source_text(data);
            }});
}

function load_source_file(file) {
    load_file(file, replace_source_text);
}

function export_file (filename) {
    //console.log("in save_file");
    var data = get_data();
    var bb = new BlobBuilder();
    bb.append(JSON.stringify(data));
    saveAs(bb.getBlob("text/plain;charset=utf-8"), filename);
}

function import_file (file) {
    load_file(file, function (data) { set_data(JSON.parse(data)); });
}

$(document).ready(function() {
    replace_source_text("1 This is a test verse. 2 A second test verse.");
});
