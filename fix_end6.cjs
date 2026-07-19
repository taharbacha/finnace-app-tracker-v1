const fs = require('fs');
let lines = fs.readFileSync('pages/CommandesGros.tsx', 'utf8').split('\n');

// the end of the file is:
// 447:             </tbody>
// 448:           </table>
// 449: 
// 450:     </div>
// 451: 
// 452:     </div>
// 453:         </div>
// 454:       </div>
// 455:     </>
// 456:     )}
// 457:     </div>

lines.splice(449, 9, '        </div>', '      </div>', '    </>', '    )}', '    </div>');

fs.writeFileSync('pages/CommandesGros.tsx', lines.join('\n'));
