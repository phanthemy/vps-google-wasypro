const fs = require('fs');

let content = fs.readFileSync('C:/Users/Administrator/.gemini/antigravity/scratch/myspa/src/App.jsx', 'utf8');

const faulty = `                    </React.Fragment>
            />
          </div>
        ))
      )}
    </div>`;

const restored = `                    </React.Fragment>
                  ))}
                </tbody>
              </table>
           </div>
        </div>
      ) : (
        images.map((src, idx) => (
          <div key={idx} className="card glass-panel" style={{ padding: '0', overflow: 'hidden', border: 'var(--border-subtle)' }}>
            <img 
              src={src} 
            />
          </div>
        ))
      )}
    </div>`;

content = content.replace(faulty, restored);
fs.writeFileSync('C:/Users/Administrator/.gemini/antigravity/scratch/myspa/src/App.jsx', content, 'utf8');
console.log('Fixed syntax error');
