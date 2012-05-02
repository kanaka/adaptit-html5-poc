var next_pile_idx = 0, next_strip_idx = 0;

function create_pile(source_text, target_text) {
    var pile, source, target;

    pile = document.createElement('div');
    pile.id = "pile-" + next_pile_idx;
    pile.className = "pile";
    next_pile_idx++;

    source = document.createElement('div'),
    source.className = 'source';
    source.innerText = source_text;
    pile.appendChild(source);

    target = document.createElement('div'),
    target.className = 'target';
    target.innerText = target_text;
    pile.appendChild(target);

    return pile;
}

function create_strip(into, title, word_string) {
    var id = "strip-" + next_strip_idx,
        strip, header, pile,
        i, words = word_string.split(' ');

    strip = document.createElement('div');
    strip.id = id;
    strip.className = "strip";
    next_strip_idx++;

    header = document.createElement('div');
    header.id = id + "-header";
    header.className = "strip-header";
    header.innerText = title;
    strip.appendChild(header);

    for (i = 0; i < words.length; i++) {
        var pile = create_pile(words[i], "*" + words[i] + "*");
        strip.appendChild(pile);
    }

    document.getElementById(into).appendChild(strip);

    // Activate select list for this strip
    SelectList('#' + id + ' .pile',
               'ui-selecting', 'ui-selected',
               handle_select);

}

function handle_select(selected) {
    console.log(">> handle_select: " + selected.length);
    console.dir(selected[0]);
    var strip = selected[0].parentElement;

    if (selected.length === 1) {
        // Split

        var cur_box = selected[0],
            msg = "Box " + next_pile_idx + ", split of " + cur_box.innerText,
            new_box = create_pile(msg, msg);

        console.log("Splitting box " + cur_box.id);

        strip.insertBefore(new_box, cur_box.nextSibling);

    } else if (selected.length > 1) {
        // Join
        var first = selected[0],
            smsg, tmsg;

        smsg = $.map(selected, function (o) { return $("#" + o.id + " .source").text(); }).join(" ");
        tmsg = $.map(selected, function (o) { return $("#" + o.id + " .target").text(); }).join(" ");

        $("#" + first.id).before(create_pile(smsg, tmsg));

        for (i = 0; i < selected.length; i++ ) {
            strip.removeChild(selected[i]);
        }
    }

    this.clear();
}


$(document).ready(function() {
    var v;

    for (v = 1; v <= source_text.verses; v++) {
        var strip = create_strip("chapter", v, source_text[v]);
    }
});
