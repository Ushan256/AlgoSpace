import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  analyzeCode,
  createDocument,
  deleteDocument,
  fetchDocument,
  fetchDocuments,
  updateDocument,
} from '../api';
import BlueprintSection from '../components/BlueprintSection';
import ComplexityGraph from '../components/ComplexityGraph';
import ExecutionStepper from '../components/ExecutionStepper';
import InputScaleSlider from '../components/InputScaleSlider';
import {
  buildDenseCurve,
  buildIdealCoordinates,
  idealTimeComplexity,
} from '../utils/complexityMath';

function Dashboard() {
  const navigate = useNavigate();
  const titleInputRef = useRef(null);
  const codeEditorRef = useRef(null);
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [scaleN, setScaleN] = useState(1000);
  const [showBlueprintDrawer, setShowBlueprintDrawer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [syntaxError, setSyntaxError] = useState('');

  const username = localStorage.getItem('algospace_username') || 'Developer';

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchDocuments();
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load documents.');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const focusWorkspace = (focusEditor = false) => {
    requestAnimationFrame(() => {
      if (!focusEditor && titleInputRef.current) {
        titleInputRef.current.focus();
        titleInputRef.current.select();
      } else if (codeEditorRef.current) {
        codeEditorRef.current.focus();
      }
    });
  };

  const applyDocument = (doc, focusEditor = false) => {
    setSelectedDoc(doc.id);
    setTitle(doc.title);
    setContent(doc.content || '');
    setAnalysis(null);
    setSyntaxError('');
    setScaleN(1000);
    setShowBlueprintDrawer(false);
    focusWorkspace(focusEditor);
  };

  const selectDocument = async (id) => {
    setError('');
    setStatus('');
    setAnalysis(null);
    setSyntaxError('');
    try {
      const doc = await fetchDocument(id);
      applyDocument(doc);
    } catch (err) {
      setError(err.message || 'Failed to load document.');
    }
  };

  const handleNewPage = async () => {
    setError('');
    setStatus('');
    setAnalysis(null);
    setSyntaxError('');
    try {
      const doc = await createDocument({ title: 'Untitled', content: '' });
      await loadDocuments();
      applyDocument(doc);
      setStatus('New page created — name your file below.');
    } catch (err) {
      setError(err.message || 'Failed to create document.');
    }
  };

  const handleBlueprint = async (blueprint) => {
    setError('');
    setStatus('');
    setAnalysis(null);
    setSyntaxError('');
    try {
      const doc = await createDocument({
        title: blueprint.pageTitle,
        content: blueprint.content,
      });
      await loadDocuments();
      applyDocument(doc, true);
      setStatus(`${blueprint.title} loaded into the profiler.`);
    } catch (err) {
      setError(err.message || 'Failed to create blueprint document.');
    }
  };

  const handleSave = async () => {
    if (!selectedDoc) {
      setError('Select or create a page before saving.');
      return;
    }
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Title cannot be empty.');
      return;
    }
    setSaving(true);
    setError('');
    setStatus('');
    try {
      await updateDocument(selectedDoc, {
        title: trimmedTitle,
        content,
        ...(analysis
          ? {
              time_complexity: analysis.time_complexity,
              space_complexity: analysis.space_complexity,
              justification: analysis.justification,
            }
          : {}),
      });
      await loadDocuments();
      setStatus('Page saved.');
    } catch (err) {
      setError(err.message || 'Failed to save document.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDoc) {
      setError('No page selected to delete.');
      return;
    }
    setError('');
    setStatus('');
    try {
      await deleteDocument(selectedDoc);
      setSelectedDoc(null);
      setTitle('');
      setContent('');
      setAnalysis(null);
      setSyntaxError('');
      await loadDocuments();
      setStatus('Page deleted.');
    } catch (err) {
      setError(err.message || 'Failed to delete document.');
    }
  };

  const handleAnalyze = async () => {
    const trimmed = content.trim();
    if (!trimmed) {
      setError('Cannot analyze empty code. Enter Python in the editor first.');
      setAnalysis(null);
      setSyntaxError('');
      return;
    }
    setAnalyzing(true);
    setError('');
    setStatus('');
    setSyntaxError('');
    try {
      const result = await analyzeCode(trimmed);
      const idealClass =
        result.ideal_time_complexity || idealTimeComplexity(result.time_complexity);
      const idealCoords =
        result.ideal_graph_coordinates ||
        buildIdealCoordinates(idealClass, result.graph_coordinates);
      const denseUser = buildDenseCurve(result.time_complexity, 10, 100000, 28);
      const denseIdeal = buildDenseCurve(idealClass, 10, 100000, 28);
      setAnalysis({
        ...result,
        ideal_time_complexity: idealClass,
        ideal_graph_coordinates: idealCoords,
        dense_user_curve: denseUser,
        dense_ideal_curve: denseIdeal,
      });
      setScaleN(1000);
      setStatus('AST complexity analysis complete.');
    } catch (err) {
      setAnalysis(null);
      const isSyntax =
        err.status === 400 &&
        (err.message || '').toLowerCase().includes('syntax error');
      if (isSyntax) {
        setSyntaxError(
          err.message ||
            'Syntax Error: Invalid Python structure or indentation detected.'
        );
        setError('');
      } else {
        setSyntaxError('');
        setError(err.message || 'Analysis request failed.');
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const handleContentChange = (e) => {
    setContent(e.target.value);
    if (syntaxError) setSyntaxError('');
  };

  const handleLogout = () => {
    localStorage.removeItem('algospace_token');
    localStorage.removeItem('algospace_username');
    navigate('/auth');
  };

  const chartUserCurve =
    analysis?.dense_user_curve || analysis?.graph_coordinates || [];
  const chartIdealCurve =
    analysis?.dense_ideal_curve || analysis?.ideal_graph_coordinates || [];
  const idealClass =
    analysis?.ideal_time_complexity ||
    (analysis ? idealTimeComplexity(analysis.time_complexity) : 'O(1)');

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>AlgoSpace</h1>
        <div className="dashboard-header-actions">
          <span className="user-info">Signed in as {username}</span>
          <button type="button" className="btn btn-danger" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      <div className="dashboard-body">
        <aside className="sidebar">
          <div className="sidebar-header">
            <h2>Pages</h2>
            <button type="button" className="btn btn-primary" onClick={handleNewPage}>
              + New Page
            </button>
          </div>
          {error && !syntaxError && (
            <div className="alert alert-error sidebar-alert">{error}</div>
          )}
          <ul className="file-list">
            {loading && <li className="empty-state">Loading pages...</li>}
            {!loading && documents.length === 0 && (
              <li className="empty-state">No pages yet — pick a blueprint below.</li>
            )}
            {!loading &&
              documents.map((doc) => (
                <li key={doc.id}>
                  <button
                    type="button"
                    className={selectedDoc === doc.id ? 'active' : ''}
                    onClick={() => selectDocument(doc.id)}
                  >
                    {doc.title || 'Untitled'}
                  </button>
                </li>
              ))}
          </ul>
        </aside>

        <main className="workspace">
          {selectedDoc ? (
            <>
              <div className="workspace-toolbar">
                <input
                  ref={titleInputRef}
                  type="text"
                  className="title-input"
                  placeholder="Page title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowBlueprintDrawer((v) => !v)}
                >
                  {showBlueprintDrawer ? 'Hide Blueprints' : 'Blueprints'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAnalyze}
                  disabled={analyzing}
                >
                  {analyzing ? 'Analyzing...' : 'Analyze Complexity'}
                </button>
                <button type="button" className="btn btn-danger" onClick={handleDelete}>
                  Delete
                </button>
                {status && <span className="status-message">{status}</span>}
              </div>

              {showBlueprintDrawer && (
                <div className="workspace-blueprint-strip">
                  <BlueprintSection
                    variant="inline"
                    onSelectBlueprint={handleBlueprint}
                  />
                </div>
              )}

              <div
                className={`editor-area profiler-workspace${
                  syntaxError ? ' profiler-workspace-syntax-error' : ''
                }`}
              >
                {syntaxError && (
                  <div className="syntax-inline-error" role="alert">
                    {syntaxError}
                  </div>
                )}
                <textarea
                  ref={codeEditorRef}
                  placeholder="Write valid Python code here for AST analysis..."
                  value={content}
                  onChange={handleContentChange}
                />

                {analysis && (
                  <section className="analysis-panel analysis-panel-rich">
                    <h3>Complexity Analysis</h3>
                    <div className="complexity-meta">
                      <div>
                        <span>Time</span>
                        <strong>{analysis.time_complexity}</strong>
                      </div>
                      <div>
                        <span>Space</span>
                        <strong>{analysis.space_complexity}</strong>
                      </div>
                      <div>
                        <span>Ideal target</span>
                        <strong>{idealClass}</strong>
                      </div>
                    </div>

                    <InputScaleSlider
                      timeComplexity={analysis.time_complexity}
                      scaleN={scaleN}
                      onScaleChange={setScaleN}
                    />

                    <p className="justification-text">{analysis.justification}</p>

                    <ComplexityGraph
                      userCoordinates={chartUserCurve}
                      idealCoordinates={chartIdealCurve}
                      userLabel={`Your code (${analysis.time_complexity})`}
                      idealLabel={`Ideal baseline (${idealClass})`}
                      timeComplexity={analysis.time_complexity}
                      idealTimeComplexity={idealClass}
                      highlightN={scaleN}
                    />

                    <ExecutionStepper
                      trace={analysis.execution_trace}
                      loopVariables={analysis.loop_variables}
                      boundVariables={analysis.bound_variables}
                    />
                  </section>
                )}
              </div>
            </>
          ) : (
            <div className="empty-dashboard">
              <div className="empty-dashboard-hero">
                <h2>Interactive Algorithm Studio</h2>
                <p>
                  Profile Python complexity with AST static analysis, live input scaling,
                  dual-line benchmark overlays, and a visual execution stepper.
                </p>
                <button type="button" className="btn btn-primary" onClick={handleNewPage}>
                  + New Page
                </button>
              </div>
              <BlueprintSection variant="empty" onSelectBlueprint={handleBlueprint} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
