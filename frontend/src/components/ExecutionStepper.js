function formatPointers(pointers) {
  if (!pointers || Object.keys(pointers).length === 0) {
    return '—';
  }
  return Object.entries(pointers)
    .map(([key, value]) => `${key}=${value}`)
    .join(' · ');
}

function ExecutionStepper({ trace, loopVariables, boundVariables }) {
  if (!trace || trace.length === 0) {
    return null;
  }

  return (
    <section className="execution-stepper-panel">
      <div className="execution-stepper-header">
        <h4>Visual Execution Stepper</h4>
        <p>
          Incremental mock trace derived from AST loop structure
          {loopVariables && loopVariables.length > 0 && (
            <span>
              {' '}
              · loop vars: <code>{loopVariables.join(', ')}</code>
            </span>
          )}
          {boundVariables && boundVariables.length > 0 && (
            <span>
              {' '}
              · bounds: <code>{[...new Set(boundVariables)].join(', ')}</code>
            </span>
          )}
        </p>
      </div>
      <div className="stepper-table-wrap">
        <table className="stepper-table">
          <thead>
            <tr>
              <th>Step</th>
              <th>Context</th>
              <th>Pointers</th>
              <th>Active Indices</th>
              <th>Collection</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {trace.map((row) => (
              <tr key={row.step} className={row.step % 2 === 0 ? 'stepper-row-alt' : ''}>
                <td>
                  <span className="step-badge">{row.step}</span>
                </td>
                <td>
                  <code>{row.line_context}</code>
                </td>
                <td className="stepper-pointers">{formatPointers(row.pointers)}</td>
                <td>
                  {row.indices_active && row.indices_active.length > 0
                    ? `[${row.indices_active.join(', ')}]`
                    : '—'}
                </td>
                <td>n={row.collection_size}</td>
                <td className="stepper-desc">{row.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default ExecutionStepper;
