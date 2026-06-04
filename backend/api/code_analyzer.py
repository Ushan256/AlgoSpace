import ast
import math

GRAPH_INPUT_SIZES = [10, 100, 250, 500, 1000]

HALVING_NAME_HINTS = frozenset({
    'low', 'high', 'lo', 'hi', 'left', 'right', 'start', 'end', 'mid', 'middle',
})


class ComplexityVisitor(ast.NodeVisitor):
    def __init__(self):
        self.max_loop_depth = 0
        self.current_loop_depth = 0
        self.has_recursion = False
        self.has_halving = False
        self._function_stack = []

    def visit_FunctionDef(self, node):
        self._function_stack.append(node.name)
        self.generic_visit(node)
        self._function_stack.pop()

    def visit_AsyncFunctionDef(self, node):
        self._function_stack.append(node.name)
        self.generic_visit(node)
        self._function_stack.pop()

    def visit_For(self, node):
        self._enter_loop(node)

    def visit_While(self, node):
        self._enter_loop(node)

    def visit_AsyncFor(self, node):
        self._enter_loop(node)

    def _enter_loop(self, node):
        self.current_loop_depth += 1
        self.max_loop_depth = max(self.max_loop_depth, self.current_loop_depth)
        self.generic_visit(node)
        self.current_loop_depth -= 1

    def visit_Call(self, node):
        if self._function_stack:
            callee = self._resolve_call_name(node.func)
            if callee and callee == self._function_stack[-1]:
                self.has_recursion = True
        self.generic_visit(node)

    def visit_Assign(self, node):
        if self._expr_has_halving(node.value):
            self.has_halving = True
        for target in node.targets:
            if isinstance(target, ast.Name) and target.id in ('mid', 'middle'):
                if self._expr_has_halving(node.value):
                    self.has_halving = True
        self.generic_visit(node)

    def visit_AugAssign(self, node):
        if self._expr_has_halving(node.value):
            self.has_halving = True
        self.generic_visit(node)

    def _resolve_call_name(self, func_node):
        if isinstance(func_node, ast.Name):
            return func_node.id
        if isinstance(func_node, ast.Attribute):
            return func_node.attr
        return None

    def _expr_has_halving(self, node):
        if node is None:
            return False
        if isinstance(node, ast.BinOp) and isinstance(node.op, ast.FloorDiv):
            divisor = node.right
            if isinstance(divisor, ast.Constant) and divisor.value == 2:
                if self._is_midpoint_sum(node.left):
                    return True
        if isinstance(node, ast.BinOp) and isinstance(node.op, ast.Add):
            if isinstance(node.right, ast.BinOp) and isinstance(node.right.op, ast.FloorDiv):
                inner = node.right
                if (
                    isinstance(inner.right, ast.Constant)
                    and inner.right.value == 2
                ):
                    return True
        if isinstance(node, ast.BinOp) and isinstance(node.op, (ast.Sub, ast.Add)):
            if self._names_suggest_range(node):
                return True
        return False

    def _is_midpoint_sum(self, node):
        if isinstance(node, ast.BinOp) and isinstance(node.op, ast.Add):
            left_names = self._collect_names(node.left)
            right_names = self._collect_names(node.right)
            combined = left_names | right_names
            if len(combined) >= 2 and combined & HALVING_NAME_HINTS:
                return True
        return False

    def _names_suggest_range(self, node):
        names = self._collect_names(node)
        return len(names & HALVING_NAME_HINTS) >= 2

    def _collect_names(self, node):
        names = set()
        for child in ast.walk(node):
            if isinstance(child, ast.Name):
                names.add(child.id)
        return names


def operations_for_time_class(time_class, n):
    if time_class == 'O(1)':
        return 1
    if time_class == 'O(log n)':
        return max(1, int(math.log2(max(n, 2))))
    if time_class == 'O(n)':
        return n
    if time_class == 'O(n²)':
        return n * n
    if time_class == 'O(n³)':
        return n ** 3
    if time_class == 'O(n log n)':
        return max(1, int(n * math.log2(max(n, 2))))
    return n


def build_graph_coordinates(time_class):
    return [
        {'input_size': n, 'operations': operations_for_time_class(time_class, n)}
        for n in GRAPH_INPUT_SIZES
    ]


def ideal_time_complexity(time_class):
    downgrade = {
        'O(n³)': 'O(n²)',
        'O(n²)': 'O(n log n)',
        'O(n log n)': 'O(n)',
        'O(n)': 'O(log n)',
        'O(log n)': 'O(1)',
        'O(1)': 'O(1)',
    }
    return downgrade.get(time_class, 'O(1)')


def classify_metrics(visitor):
    loop_depth = visitor.max_loop_depth
    has_recursion = visitor.has_recursion
    has_halving = visitor.has_halving

    if loop_depth >= 3:
        return (
            'O(n³)',
            'O(n²)',
            (
                f'AST detected {loop_depth} levels of nested loops (e.g. matrix multiplication). '
                'Time grows cubically with input size; auxiliary space scales quadratically.'
            ),
        )

    if loop_depth >= 2:
        return (
            'O(n²)',
            'O(1)',
            (
                f'AST detected {loop_depth} nested loop structures (e.g. bubble sort). '
                'Quadratic time with constant extra space beyond the input.'
            ),
        )

    if has_halving:
        return (
            'O(log n)',
            'O(1)',
            (
                'AST detected halving boundary patterns such as (low + high) // 2 '
                '(e.g. binary search). Logarithmic time, constant auxiliary space.'
            ),
        )

    if loop_depth >= 1 or has_recursion:
        space = 'O(n)' if has_recursion else 'O(1)'
        parts = []
        if loop_depth >= 1:
            parts.append(f'{loop_depth} iterative loop(s)')
        if has_recursion:
            parts.append('recursive self-call(s) that accumulate stack frames')
        detail = ' and '.join(parts)
        return (
            'O(n)',
            space,
            (
                f'AST detected linear structure: {detail}. '
                'Time scales linearly with input size.'
            ),
        )

    return (
        'O(1)',
        'O(1)',
        'AST found no loops or recursion. Constant time and constant auxiliary space.',
    )


class LoopStructureCollector(ast.NodeVisitor):
    def __init__(self):
        self.loop_variables = []
        self.bound_variables = []

    def visit_For(self, node):
        target = node.target
        if isinstance(target, ast.Name):
            self.loop_variables.append(target.id)
        self.generic_visit(node)

    def visit_While(self, node):
        for child in ast.walk(node):
            if isinstance(child, ast.Name) and child.id in HALVING_NAME_HINTS:
                self.bound_variables.append(child.id)
        self.generic_visit(node)


def build_execution_trace(visitor, time_class, max_steps=16):
    trace = []
    collection_size = 8
    step_num = 1

    if visitor.has_halving:
        low = 0
        high = collection_size - 1
        target_index = collection_size // 2
        while low <= high and step_num <= max_steps:
            mid = (low + high) // 2
            if mid < target_index:
                description = (
                    f'Target index {target_index} is right of mid — '
                    f'advance low from {low} to {mid + 1}'
                )
                next_low = mid + 1
                next_high = high
            elif mid > target_index:
                description = (
                    f'Target index {target_index} is left of mid — '
                    f'reduce high from {high} to {mid - 1}'
                )
                next_low = low
                next_high = mid - 1
            else:
                description = f'Element at mid={mid} matches target — search completes'
                next_low = mid + 1
                next_high = mid - 1
            trace.append({
                'step': step_num,
                'line_context': 'while low <= high',
                'pointers': {'low': low, 'high': high, 'mid': mid},
                'indices_active': [low, mid, high],
                'collection_size': collection_size,
                'description': description,
            })
            low = next_low
            high = next_high
            step_num += 1
        return trace

    if visitor.max_loop_depth >= 2:
        n = min(5, collection_size)
        for i in range(n):
            inner_limit = max(0, n - i - 1)
            for j in range(inner_limit):
                if step_num > max_steps:
                    return trace
                active = [j]
                if j + 1 < n:
                    active.append(j + 1)
                trace.append({
                    'step': step_num,
                    'line_context': 'for i ... for j ...',
                    'pointers': {'i': i, 'j': j},
                    'indices_active': active,
                    'collection_size': n,
                    'description': (
                        f'Outer index i={i} — inner pointer j={j} '
                        f'compares adjacent elements at positions {j} and {j + 1}'
                    ),
                })
                step_num += 1
        return trace

    if visitor.has_recursion:
        for current_n in range(collection_size, 0, -1):
            if step_num > max_steps:
                break
            stack_depth = collection_size - current_n + 1
            trace.append({
                'step': step_num,
                'line_context': 'recursive self-call',
                'pointers': {'n': current_n, 'stack_depth': stack_depth},
                'indices_active': list(range(stack_depth)),
                'collection_size': collection_size,
                'description': (
                    f'Recursive frame n={current_n} — stack depth {stack_depth} '
                    f'before returning toward base case'
                ),
            })
            step_num += 1
        return trace

    if visitor.max_loop_depth >= 1:
        for i in range(min(collection_size, max_steps)):
            trace.append({
                'step': step_num,
                'line_context': 'for i in range(...)',
                'pointers': {'i': i},
                'indices_active': [i],
                'collection_size': collection_size,
                'description': f'Linear scan — loop index i={i} visits collection position {i}',
            })
            step_num += 1
        return trace

    trace.append({
        'step': 1,
        'line_context': 'constant-time block',
        'pointers': {},
        'indices_active': [],
        'collection_size': 1,
        'description': 'No loops or recursion detected — single constant-time execution step',
    })
    return trace


def analyze_python_code(source):
    tree = ast.parse(source)
    visitor = ComplexityVisitor()
    visitor.visit(tree)
    structure = LoopStructureCollector()
    structure.visit(tree)
    time_class, space_class, justification = classify_metrics(visitor)
    graph_coordinates = build_graph_coordinates(time_class)
    ideal_class = ideal_time_complexity(time_class)
    ideal_graph_coordinates = build_graph_coordinates(ideal_class)
    execution_trace = build_execution_trace(visitor, time_class)
    return {
        'time_complexity': time_class,
        'space_complexity': space_class,
        'justification': justification,
        'graph_coordinates': graph_coordinates,
        'ideal_time_complexity': ideal_class,
        'ideal_graph_coordinates': ideal_graph_coordinates,
        'execution_trace': execution_trace,
        'loop_variables': structure.loop_variables,
        'bound_variables': list(set(structure.bound_variables)),
        'max_loop_depth': visitor.max_loop_depth,
        'has_recursion': visitor.has_recursion,
        'has_halving': visitor.has_halving,
    }
