const parse = require("./parser");
const { formatSequent, formatExpression } = require("./formatter");
const sequent = "(p ∧ q) → (r ∨ s) ⊢ (p → r) ∨ (q → s)"

isValid(sequent);

function isValid(sequent) {
    const parsedSequent = parse(sequent);
    console.log("Input Sequent:", formatSequent(parsedSequent, true));
    console.log("Attempting to prove validity of sequent via semantic tableaux");
    return checkValidity(parsedSequent, true);
}

function checkValidity(parsedSequent, showWorking) {
    const steps = [];
    for (let exp of parsedSequent.premises) {
        steps.push({
            value: true,
            exp,
        })
    }
    steps.push({
        value: false, // proof by contradiction
        exp: parsedSequent.conclusion,
    })
    const tableaux = { steps, left: undefined, right: undefined };
    let finishedWorking = doWork(tableaux);

    if (showWorking) {
        console.log(renderSteps(finishedWorking))
    }

    const { foundContradiction, dict } = checkTreeForContradictions(finishedWorking);
    if (foundContradiction) {
        console.log('Success, Sequent is valid');
        return true;
    } else {
        console.log("Sequent not valid. Counter example:")
        for (const atom in dict) {
            console.log(`${atom}: ${dict[atom]}`)
        }
        return false;
    }

}

// This function is not used anymore but may be useful.
function stripNonAtomsFromWorkingTree(tree) {
    if (!tree) return;
    return {
        steps: tree.steps.filter(s => s.exp.type == 'atom'),
        left: stripNonAtomsFromWorkingTree(tree.left),
        right: stripNonAtomsFromWorkingTree(tree.right),
    }
}

function checkTreeForContradictions(tree) {
    let dict = {}
    if (!tree) return { dict };
    for (let step of tree.steps) {
        if (step.exp.type != 'atom') continue;
        if (dict[step.exp.value] !== undefined) {
            if (dict[step.exp.value] !== step.value) {
                return { foundContradiction: true }
            }
        } else {
            dict[step.exp.value] = step.value
        }
    }
    let foundContradictionInLeft = false;
    const leftBranch = checkTreeForContradictions(tree.left);
    if (leftBranch.foundContradiction) {
        foundContradictionInLeft = true;
    } else {
        for (const atom in dict) {
            if (leftBranch.dict[atom] !== undefined && dict[atom] !== leftBranch.dict[atom]) {
                foundContradictionInLeft = true;
                break;
            }
        }
    }
    let foundContradictionInRight = false;
    const rightBranch = checkTreeForContradictions(tree.right);
    if (rightBranch.foundContradiction) {
        foundContradictionInRight = true;
    }
    else {
        for (const atom in dict) {
            if (rightBranch.dict[atom] !== undefined && dict[atom] !== rightBranch.dict[atom]) {
                foundContradictionInRight = true;
                break;
            }
        }
    }
    if (foundContradictionInLeft && foundContradictionInRight) {
        return { foundContradiction: true };
    };
    dict = { ...dict, ...leftBranch.dict, ...rightBranch.dict };
    return { dict };
}

function doWork({ steps, left, right }) {
    // make sure to do all non branching steps first
    for (const step of steps) {
        if (step.evaluated) continue;
        if (step.exp.type == 'atom') step.evaluated = true; // make sure that atoms are not processed;
        if (step.exp.type == 'not') {
            step.evaluated = true;
            const nextSteps = [...steps, {
                value: !step.value,
                exp: step.exp.exp,
            }];
            return doWork({
                steps: nextSteps, left, right
            })
        }
        if (step.exp.type == 'and' && step.value) {
            step.evaluated = true;
            const l = {
                value: true,
                exp: step.exp.left,
            }
            const r = {
                value: true,
                exp: step.exp.right,
            }
            return doWork({
                steps: [...steps, l, r], left, right
            })
        }
        if (step.exp.type == 'or' && !step.value) {
            step.evaluated = true;
            const l = {
                value: false,
                exp: step.exp.left,
            }
            const r = {
                value: false,
                exp: step.exp.right,
            }
            return doWork({
                steps: [...steps, l, r], left, right
            })
        }
        if (step.exp.type == 'implies' && !step.value) {
            step.evaluated = true;
            const l = {
                value: true,
                exp: step.exp.left,
            }
            const r = {
                value: false,
                exp: step.exp.right,
            }
            return doWork({
                steps: [...steps, l, r], left, right
            })
        }
    }
    // now complete branching steps
    for (const step of steps) {
        if (step.evaluated) continue;
        if (step.exp.type == 'and' && !step.value) {
            step.evaluated = true;
            const l = {
                value: false,
                exp: step.exp.left,
            }
            const r = {
                value: false,
                exp: step.exp.right,
            }
            return {
                steps: steps.filter(s => s.evaluated),
                left: doWork({ steps: [...steps.filter(s => !s.evaluated).map(s => ({ ...s })), l] }),
                right: doWork({ steps: [...steps.filter(s => !s.evaluated).map(s => ({ ...s })), r] }),
            }
        }
        if (step.exp.type == 'or' && step.value) {
            step.evaluated = true;
            const l = {
                value: true,
                exp: step.exp.left,
            }
            const r = {
                value: true,
                exp: step.exp.right,
            }
            return {
                steps: steps.filter(s => s.evaluated),
                left: doWork({ steps: [...steps.filter(s => !s.evaluated).map(s => ({ ...s })), l] }),
                right: doWork({ steps: [...steps.filter(s => !s.evaluated).map(s => ({ ...s })), r] }),
            }
        }
        if (step.exp.type == 'implies' && step.value) {
            step.evaluated = true;
            const l = {
                value: false,
                exp: step.exp.left,
            }
            const r = {
                value: true,
                exp: step.exp.right,
            }
            return {
                steps: steps.filter(s => s.evaluated),
                left: doWork({ steps: [...steps.filter(s => !s.evaluated).map(s => ({ ...s })), l] }),
                right: doWork({ steps: [...steps.filter(s => !s.evaluated).map(s => ({ ...s })), r] }),
            }
        }
    }
    return { steps, left, right };
}

function renderSteps({ steps, left, right }, startIndex = 1) {
    let str = steps.map((step, i) => {
        return `${i + startIndex}:  ${step.value ? "T" : "F"}: ${formatExpression(step.exp, true)}`;
    }).join("\n");
    if (left) {
        str += '\n';
        let lb = renderSteps(left, startIndex + steps.length)
        str += "LB: \n" + lb.split("\n").map(s => '    ' + s).join("\n");
    }
    if (right) {
        const leftLength = (l) => l.steps.length + (l.left ? leftLength(l.left) : 0) + (l.right ? leftLength(l.right) : 0);
        str += '\n';
        let rb = renderSteps(right, leftLength(left) + startIndex + steps.length)
        str += "RB: \n" + rb.split("\n").map(s => '    ' + s).join("\n");
    }
    return str;
}