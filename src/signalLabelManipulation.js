import * as d3 from 'd3';

export function signalLabelManipulationRegisterHandlers (rootElm, signalList) {
    rootElm.on('focus', function () {
        d3.select(this).on('keydown', function () {
            var tagName = d3.select(d3.event.target).node().tagName;
            if (tagName === 'INPUT' || tagName === 'SELECT' || tagName === 'TEXTAREA') {
                // ignore text edit elements
                return;
            }
            if (d3.event.key === 'Delete') {
                signalList.filter(function (d) {
                    return !d.type.selected;
                });
            }
        });
    });
}

export function signalLabelManipulation (signalList, labels, ROW_Y) {
    var previouslyClicked = null;
    function resolveInsertTarget (y) {
        var targetParentNode, onParentI, siblings;

        var nodes = signalList.visibleNodes();
        for (var i = 0; i < nodes.length; i++) {
            var n = nodes[i];
            if (y <= n.y - ROW_Y * 0.5 && n.parent) {
                // insert before n (parent is checked be)
                siblings = n.parent.children;
                targetParentNode = n.parent;
                onParentI = siblings.indexOf(n);
                break;
            } else if (y <= n.y + ROW_Y) {
                // insert after
                // if n is hierarchical insert into
                if (n.children) {
                    targetParentNode = n;
                    onParentI = 0;
                    break;
                } else {
                    siblings = n.parent.children;
                    targetParentNode = n.parent;
                    onParentI = siblings.indexOf(n) + 1;
                    break;
                }
            }
        }
        return [targetParentNode, onParentI];
    }

    // select and de-select all "g"
    // signal labels dragging, reordering
    function dragStarted (d) {
    // move to front to make it virtually on top of all others
        d3.select(this).raise();
        // d = index of clicked signal
        var current = d;
        var shiftKey = d3.event.shiftKey || d3.event.sourceEvent.shiftKey;
        if (shiftKey && previouslyClicked != null) {
            // select all between last selected and clicked
            // de-select all
            signalList.visibleNodes().forEach(function (d) {
                var i = d.id;
                if (previouslyClicked.id < current.id) {
                    d.data.type.selected = previouslyClicked.id <= i && i <= current.id;
                } else {
                    d.data.type.selected = previouslyClicked.id >= i && i >= current.id;
                }
            });
            labels.classed('selected', (d) => d.data.type.selected);
            return;
        }
        var altKey = d3.event.altKey || d3.event.sourceEvent.altKey;
        if (!altKey) {
            signalList.visibleNodes().forEach(function (d) {
                if (current !== d) { d.data.type.selected = false; }
            });
        }
        // toggle selection
        current.data.type.selected = !current.data.type.selected;
        // el.raise().classed("selected", isselected);
        labels.classed('selected', (d) => d.data.type.selected);
    }
    function dragged (d) {
        var el = d3.select(this);
        el.attr('transform', 'translate(' + d.x + ',' + d3.event.y + ')');
    // var insertTarget = resolveInsertTarget(d3.event.y);
    // console.log(insertTarget);
    }
    function regenerateDepth (d) {
        var offset = d.depth;
        (d.children || []).forEach((d2) => {
            d2.depth = offset + 1;
            regenerateDepth(d2);
        });
    }
    function dragEnded (d) {
        var el = d3.select(this);
        // move to front to make it virtually on top of all others
        el.lower();
        var insertTarget = resolveInsertTarget(d3.event.y);
        // console.log(insertTarget);
        var shiftKey = d3.event.shiftKey || d3.event.sourceEvent.shiftKey;
        if (!(previouslyClicked != null && shiftKey) && d.data.type.selected) {
            previouslyClicked = d;
        } else {
            previouslyClicked = null;
        }

        // check if inserting to it self
        var newParent = insertTarget[0];
        var newIndex = insertTarget[1];
        var _newParent = newParent;
        var insertingToItself = false;
        while (_newParent) {
            if (_newParent === d) {
                insertingToItself = true;
                break;
            }
            _newParent = _newParent.parent;
        }

        if (!insertingToItself && (
            newParent !== d.parent ||
        newIndex !== d.parent.children.indexOf(d))) {
            // moving on new place
            el.classed('selected', false);
            // insert on new place (we do it first, because we do not want to break indexing)
            var oldSiblings = d.parent.children;
            var oldIndex = oldSiblings.indexOf(d);
            var newSiblings = insertTarget[0].children;
            newSiblings.splice(newIndex, 0, d);
            // remove from original possition
            if (newSiblings === oldSiblings && newIndex < oldIndex) {
                oldIndex += 1;
            }
            oldSiblings.splice(oldIndex, 1);
            d.parent = insertTarget[0];
            d.depth = d.parent.depth + 1;
            regenerateDepth(d);
            signalList.update();
        } else {
            // put label back to it's original possition
            el.attr('transform', 'translate(' + d.x + ',' + d.y + ')');
        }
    }

    labels.call(
        d3.drag()
            .on('start', dragStarted)
            .on('drag', dragged)
            .on('end', dragEnded)
    );
}
