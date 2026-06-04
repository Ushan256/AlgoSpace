const BLUEPRINTS = [
  {
    id: 'bubble-sort',
    title: 'Bubble Sort (Quadratic)',
    badge: 'O(n²)',
    description: 'Dual nested loops comparing adjacent elements each pass.',
    pageTitle: 'Bubble Sort (Quadratic)',
    content: `def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr
`,
  },
  {
    id: 'binary-search',
    title: 'Binary Search (Logarithmic)',
    badge: 'O(log n)',
    description: 'Halving search space with low, high, and mid pointers.',
    pageTitle: 'Binary Search (Logarithmic)',
    content: `def binary_search(arr, target):
    low = 0
    high = len(arr) - 1
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1
`,
  },
  {
    id: 'recursive-addition',
    title: 'Recursive Addition (Linear)',
    badge: 'O(n)',
    description: 'Linear recursion decrementing n until the base case.',
    pageTitle: 'Recursive Addition (Linear)',
    content: `def recursive_add(n):
    if n <= 0:
        return 0
    return n + recursive_add(n - 1)
`,
  },
];

function BlueprintSection({ onSelectBlueprint, variant }) {
  return (
    <section className={`blueprint-drawer blueprint-drawer-${variant}`}>
      <div className="blueprint-drawer-head">
        <h3>Select an Algorithmic Blueprint</h3>
        <p>Instantly spawn a page, focus the workspace, and preload verified Python templates.</p>
      </div>
      <div className="blueprint-cards blueprint-cards-prominent">
        {BLUEPRINTS.map((bp) => (
          <button
            key={bp.id}
            type="button"
            className="blueprint-card blueprint-card-rich"
            onClick={() => onSelectBlueprint(bp)}
          >
            <span className="blueprint-card-badge">{bp.badge}</span>
            <span className="blueprint-card-title">{bp.title}</span>
            <span className="blueprint-card-desc">{bp.description}</span>
            <span className="blueprint-card-cta">Load template →</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export { BLUEPRINTS };
export default BlueprintSection;
