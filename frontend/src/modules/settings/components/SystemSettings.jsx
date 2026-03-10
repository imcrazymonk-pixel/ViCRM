// Компонент системных настроек
export const SystemSettings = ({ tableStyle, setTableStyle, glassEffect, setGlassEffect }) => {
  return (
    <div>
      {/* Отображение таблиц */}
      <div className="action-card">
        <div className="card-header">
          <h5><i className="bi bi-display"></i> Отображение таблиц</h5>
        </div>
        <div className="p-3">
          <label className="filter-label mb-3">Выберите стиль отображения таблиц:</label>

          <div className="d-flex flex-column gap-3">
            {/* Нормальный */}
            <label className="d-flex align-items-start gap-3 p-3 rounded"
                   style={{
                     background: tableStyle === 'normal'
                       ? 'rgba(139, 92, 246, 0.15)'
                       : 'rgba(0, 0, 0, 0.2)',
                     border: tableStyle === 'normal'
                       ? '1px solid rgba(139, 92, 246, 0.3)'
                       : '1px solid transparent',
                     cursor: 'pointer',
                     transition: 'all 0.2s'
                   }}
                   onClick={() => setTableStyle('normal')}
            >
              <input
                type="radio"
                name="tableStyle"
                className="mt-1"
                checked={tableStyle === 'normal'}
                onChange={() => setTableStyle('normal')}
              />
              <div>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                  📊 Обычный
                </div>
                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                  Стандартные отступы, читаемый шрифт. По умолчанию.
                </div>
              </div>
            </label>

            {/* Компактный */}
            <label className="d-flex align-items-start gap-3 p-3 rounded"
                   style={{
                     background: tableStyle === 'compact'
                       ? 'rgba(139, 92, 246, 0.15)'
                       : 'rgba(0, 0, 0, 0.2)',
                     border: tableStyle === 'compact'
                       ? '1px solid rgba(139, 92, 246, 0.3)'
                       : '1px solid transparent',
                     cursor: 'pointer',
                     transition: 'all 0.2s'
                   }}
                   onClick={() => setTableStyle('compact')}
            >
              <input
                type="radio"
                name="tableStyle"
                className="mt-1"
                checked={tableStyle === 'compact'}
                onChange={() => setTableStyle('compact')}
              />
              <div>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                  📐 Компактный
                </div>
                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                  Уменьшенные отступы, шрифт 0.85rem. Экономия ~25% места.
                </div>
              </div>
            </label>

            {/* Ультра */}
            <label className="d-flex align-items-start gap-3 p-3 rounded"
                   style={{
                     background: tableStyle === 'ultra'
                       ? 'rgba(139, 92, 246, 0.15)'
                       : 'rgba(0, 0, 0, 0.2)',
                     border: tableStyle === 'ultra'
                       ? '1px solid rgba(139, 92, 246, 0.3)'
                       : '1px solid transparent',
                     cursor: 'pointer',
                     transition: 'all 0.2s'
                   }}
                   onClick={() => setTableStyle('ultra')}
            >
              <input
                type="radio"
                name="tableStyle"
                className="mt-1"
                checked={tableStyle === 'ultra'}
                onChange={() => setTableStyle('ultra')}
              />
              <div>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                  📏 Ультра-компактный
                </div>
                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                  Минимальные отступы, шрифт 0.75rem. Экономия ~40% места.
                </div>
              </div>
            </label>
          </div>

          {/* Предпросмотр */}
          <div className="mt-4 p-3 rounded" style={{ background: 'rgba(0, 0, 0, 0.2)' }}>
            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '10px' }}>
              👁️ Предпросмотр:
            </div>
            <table className="data-table" style={{ fontSize: tableStyle === 'ultra' ? '0.75rem' : tableStyle === 'compact' ? '0.85rem' : '0.9rem' }}>
              <thead>
                <tr>
                  <th style={{ padding: tableStyle === 'ultra' ? '6px 8px' : tableStyle === 'compact' ? '8px 10px' : '14px 16px' }}>Дата</th>
                  <th style={{ padding: tableStyle === 'ultra' ? '6px 8px' : tableStyle === 'compact' ? '8px 10px' : '14px 16px' }}>Контрагент</th>
                  <th style={{ padding: tableStyle === 'ultra' ? '6px 8px' : tableStyle === 'compact' ? '8px 10px' : '14px 16px' }}>Сумма</th>
                  <th style={{ padding: tableStyle === 'ultra' ? '6px 8px' : tableStyle === 'compact' ? '8px 10px' : '14px 16px' }}></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: tableStyle === 'ultra' ? '6px 8px' : tableStyle === 'compact' ? '8px 10px' : '14px 16px' }}>05.03.2026</td>
                  <td style={{ padding: tableStyle === 'ultra' ? '6px 8px' : tableStyle === 'compact' ? '8px 10px' : '14px 16px' }}>ООО "Ромашка"</td>
                  <td style={{ padding: tableStyle === 'ultra' ? '6px 8px' : tableStyle === 'compact' ? '8px 10px' : '14px 16px' }} className="amount-positive">+15 000 ₽</td>
                  <td style={{ padding: tableStyle === 'ultra' ? '6px 8px' : tableStyle === 'compact' ? '8px 10px' : '14px 16px' }}>
                    <button className="btn btn-outline-primary btn-sm action-btn" style={{ padding: tableStyle === 'ultra' ? '4px 8px' : '8px 12px' }}>
                      <i className="bi bi-pencil"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Эффекты прозрачности */}
      <div className="action-card mt-4">
        <div className="card-header">
          <h5><i className="bi bi-fingerprint"></i> Эффекты прозрачности</h5>
        </div>
        <div className="p-3">
          <label className="filter-label mb-3">Выберите эффект оформления блоков:</label>

          <div className="d-flex flex-column gap-3">
            {/* Glassmorphism */}
            <label className="d-flex align-items-start gap-3 p-3 rounded"
                   style={{
                     background: glassEffect === 'glass'
                       ? 'rgba(139, 92, 246, 0.15)'
                       : 'rgba(0, 0, 0, 0.2)',
                     border: glassEffect === 'glass'
                       ? '1px solid rgba(139, 92, 246, 0.3)'
                       : '1px solid transparent',
                     cursor: 'pointer',
                     transition: 'all 0.2s'
                   }}
                   onClick={() => setGlassEffect('glass')}
            >
              <input
                type="radio"
                name="glassEffect"
                className="mt-1"
                checked={glassEffect === 'glass'}
                onChange={() => setGlassEffect('glass')}
              />
              <div>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                  🔮 Glassmorphism (по умолчанию)
                </div>
                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                  Матовое стекло с размытием фона. Современный вид.
                </div>
              </div>
            </label>

            {/* Solid */}
            <label className="d-flex align-items-start gap-3 p-3 rounded"
                   style={{
                     background: glassEffect === 'solid'
                       ? 'rgba(139, 92, 246, 0.15)'
                       : 'rgba(0, 0, 0, 0.2)',
                     border: glassEffect === 'solid'
                       ? '1px solid rgba(139, 92, 246, 0.3)'
                       : '1px solid transparent',
                     cursor: 'pointer',
                     transition: 'all 0.2s'
                   }}
                   onClick={() => setGlassEffect('solid')}
            >
              <input
                type="radio"
                name="glassEffect"
                className="mt-1"
                checked={glassEffect === 'solid'}
                onChange={() => setGlassEffect('solid')}
              />
              <div>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                  🧱 Solid (непрозрачный)
                </div>
                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                  Полностью непрозрачные блоки. Максимальная читаемость.
                </div>
              </div>
            </label>

            {/* Light Glass */}
            <label className="d-flex align-items-start gap-3 p-3 rounded"
                   style={{
                     background: glassEffect === 'light'
                       ? 'rgba(139, 92, 246, 0.15)'
                       : 'rgba(0, 0, 0, 0.2)',
                     border: glassEffect === 'light'
                       ? '1px solid rgba(139, 92, 246, 0.3)'
                       : '1px solid transparent',
                     cursor: 'pointer',
                     transition: 'all 0.2s'
                   }}
                   onClick={() => setGlassEffect('light')}
            >
              <input
                type="radio"
                name="glassEffect"
                className="mt-1"
                checked={glassEffect === 'light'}
                onChange={() => setGlassEffect('light')}
              />
              <div>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                  💎 Light Glass (лёгкий)
                </div>
                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                  Лёгкая прозрачность 50%. Воздушный интерфейс.
                </div>
              </div>
            </label>

            {/* Deep Glass */}
            <label className="d-flex align-items-start gap-3 p-3 rounded"
                   style={{
                     background: glassEffect === 'deep'
                       ? 'rgba(139, 92, 246, 0.15)'
                       : 'rgba(0, 0, 0, 0.2)',
                     border: glassEffect === 'deep'
                       ? '1px solid rgba(139, 92, 246, 0.3)'
                       : '1px solid transparent',
                     cursor: 'pointer',
                     transition: 'all 0.2s'
                   }}
                   onClick={() => setGlassEffect('deep')}
            >
              <input
                type="radio"
                name="glassEffect"
                className="mt-1"
                checked={glassEffect === 'deep'}
                onChange={() => setGlassEffect('deep')}
              />
              <div>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                  🌊 Deep Glass (глубокий)
                </div>
                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                  Усиленное размытие и прозрачность. Глубокий эффект.
                </div>
              </div>
            </label>

            {/* Neon Glass */}
            <label className="d-flex align-items-start gap-3 p-3 rounded"
                   style={{
                     background: glassEffect === 'neon'
                       ? 'rgba(139, 92, 246, 0.15)'
                       : 'rgba(0, 0, 0, 0.2)',
                     border: glassEffect === 'neon'
                       ? '1px solid rgba(139, 92, 246, 0.3)'
                       : '1px solid transparent',
                     cursor: 'pointer',
                     transition: 'all 0.2s'
                   }}
                   onClick={() => setGlassEffect('neon')}
            >
              <input
                type="radio"
                name="glassEffect"
                className="mt-1"
                checked={glassEffect === 'neon'}
                onChange={() => setGlassEffect('neon')}
              />
              <div>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                  ✨ Neon Glass (неон)
                </div>
                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                  Свечение по краям блоков. Эффектный вид.
                </div>
              </div>
            </label>

            {/* Gradient Glass */}
            <label className="d-flex align-items-start gap-3 p-3 rounded"
                   style={{
                     background: glassEffect === 'gradient'
                       ? 'rgba(139, 92, 246, 0.15)'
                       : 'rgba(0, 0, 0, 0.2)',
                     border: glassEffect === 'gradient'
                       ? '1px solid rgba(139, 92, 246, 0.3)'
                       : '1px solid transparent',
                     cursor: 'pointer',
                     transition: 'all 0.2s'
                   }}
                   onClick={() => setGlassEffect('gradient')}
            >
              <input
                type="radio"
                name="glassEffect"
                className="mt-1"
                checked={glassEffect === 'gradient'}
                onChange={() => setGlassEffect('gradient')}
              />
              <div>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                  🌈 Gradient Glass (градиент)
                </div>
                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                  Градиентная прозрачность. Яркий современный стиль.
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SystemSettings
