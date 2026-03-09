import { useState } from 'react'

const Layout = ({ children, activeItem = 'finance-stats', onItemChange, theme, onToggleTheme }) => {
  const [sidebarUnfoldable, setSidebarUnfoldable] = useState(false)

  const handleItemClick = (itemId) => {
    if (onItemChange) {
      onItemChange(itemId)
    }
  }

  const handleThemeChange = (newTheme) => {
    if (onToggleTheme) {
      onToggleTheme(newTheme)
    }
  }

  const toggleSidebarUnfoldable = () => {
    setSidebarUnfoldable(!sidebarUnfoldable)
  }

  return (
    <div className="d-flex" id="wrapper" style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <div
        className={`sidebar sidebar-dark sidebar-fixed border-end ${sidebarUnfoldable ? 'sidebar-unfoldable' : ''}`}
        style={{
          zIndex: 1000,
          width: sidebarUnfoldable ? '70px' : '260px',
          transition: 'width 0.3s',
          overflow: 'visible'
        }}
      >
        {/* Brand */}
        <a className="sidebar-brand d-none d-md-flex p-3 text-white" style={{ textDecoration: 'none' }}>
          <span className="me-2" style={{ fontSize: '1.2rem' }}>🔶</span>
          <span className="fw-bold" style={{ fontSize: '1rem', textDecoration: 'none' }}>ViCRM</span>
        </a>

        {/* Nav */}
        <ul className="sidebar-nav">
          {/* Финансы */}
          <li className="nav-title px-3">Финансы</li>

          <li className="nav-item">
            <a
              className={`nav-link ${activeItem === 'finance-stats' ? 'active' : ''}`}
              href="#"
              aria-current="page"
              onClick={(e) => { e.preventDefault(); handleItemClick('finance-stats') }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="icon me-2" role="img" aria-hidden="true" style={{ width: '16px', height: '16px', fill: 'currentColor' }}>
                <path d="M425.706,142.294A240,240,0,0,0,16,312v88H160V368H48V312c0-114.691,93.309-208,208-208s208,93.309,208,208v56H352v32H496V312A238.432,238.432,0,0,0,425.706,142.294Z"></path>
                <rect width="32" height="32" x="80" y="264"></rect>
                <rect width="32" height="32" x="240" y="128"></rect>
                <rect width="32" height="32" x="136" y="168"></rect>
                <rect width="32" height="32" x="400" y="264"></rect>
                <path d="M297.222,335.1l69.2-144.173-28.85-13.848L268.389,321.214A64.141,64.141,0,1,0,297.222,335.1ZM256,416a32,32,0,1,1,32-32A32.036,32.036,0,0,1,256,416Z"></path>
              </svg>
              <span className="ms-2">Статистика</span>
            </a>
          </li>

          <li className="nav-item">
            <a
              className={`nav-link ${activeItem === 'finance-editor' ? 'active' : ''}`}
              href="#"
              onClick={(e) => { e.preventDefault(); handleItemClick('finance-editor') }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="icon me-2" role="img" aria-hidden="true" style={{ width: '16px', height: '16px', fill: 'currentColor' }}>
                <path d="M29.663,482.25l.087.087a24.847,24.847,0,0,0,17.612,7.342,25.178,25.178,0,0,0,8.1-1.345l142.006-48.172,272.5-272.5A88.832,88.832,0,0,0,344.334,42.039l-272.5,272.5L23.666,456.541A24.844,24.844,0,0,0,29.663,482.25Zm337.3-417.584a56.832,56.832,0,0,1,80.371,80.373L411.5,180.873,331.127,100.5ZM99.744,331.884,308.5,123.127,388.873,203.5,180.116,412.256,58.482,453.518Z"></path>
              </svg>
              <span className="ms-2">Редактор</span>
            </a>
          </li>

          <li className="nav-item">
            <a
              className={`nav-link ${activeItem === 'finance-participants' ? 'active' : ''}`}
              href="#"
              onClick={(e) => { e.preventDefault(); handleItemClick('finance-participants') }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="icon me-2" role="img" aria-hidden="true" style={{ width: '16px', height: '16px', fill: 'currentColor' }}>
                <path d="M164 80c-17.7 0-32 14.3-32 32v28.8c-27.5 7.1-51.7 21.9-70.4 41.9L43.2 164.3C28.1 179.4 20 199.4 20 220v16c0 17.7 14.3 32 32 32s32-14.3 32-32v-16c0-3.8 1.5-7.4 4.2-10.1l18.4-18.4c15.6-15.6 36.8-24.4 58.9-24.4h3.5c17.7 0 32-14.3 32-32V112c0-17.7-14.3-32-32-32zm288 0c-17.7 0-32 14.3-32 32v28.8c-27.5 7.1-51.7 21.9-70.4 41.9l-18.4-18.4c-15.1-15.1-23.2-35.1-23.2-55.7v-16c0-17.7 14.3-32 32-32s32 14.3 32 32v16c0 3.8-1.5 7.4-4.2 10.1l-18.4 18.4c-15.6 15.6-36.8 24.4-58.9 24.4h-3.5c-17.7 0-32-14.3-32-32V112c0-17.7-14.3-32-32-32s-32 14.3 32 32v28.8c-27.5 7.1-51.7 21.9-70.4 41.9l-18.4-18.4c-15.1-15.1-23.2-35.1-23.2-55.7v-16c0-17.7 14.3-32 32-32s32 14.3 32 32v16c0 3.8-1.5 7.4-4.2 10.1l-18.4 18.4c-15.6 15.6-36.8 24.4-58.9 24.4H164c-17.7 0-32-14.3-32-32V112c0-17.7 14.3-32 32-32s32 14.3 32 32v28.8c-27.5 7.1-51.7 21.9-70.4 41.9l-18.4-18.4c-15.1-15.1-23.2-35.1-23.2-55.7v-16c0-17.7 14.3-32 32-32s32 14.3 32 32v16c0 3.8-1.5 7.4-4.2 10.1l-18.4 18.4c-15.6 15.6-36.8 24.4-58.9 24.4H80c-17.7 0-32-14.3-32-32V112c0-17.7 14.3-32 32-32z"></path>
              </svg>
              <span className="ms-2">Участники</span>
            </a>
          </li>

          <li className="nav-item">
            <a
              className={`nav-link ${activeItem === 'finance-forecast' ? 'active' : ''}`}
              href="#"
              onClick={(e) => { e.preventDefault(); handleItemClick('finance-forecast') }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="icon me-2" role="img" aria-hidden="true" style={{ width: '16px', height: '16px', fill: 'currentColor' }}>
                <path d="M268.279,496c-67.574,0-130.978-26.191-178.534-73.745S16,311.293,16,243.718A252.252,252.252,0,0,1,154.183,18.676a24.44,24.44,0,0,1,34.46,28.958,220.12,220.12,0,0,0,54.8,220.923A218.746,218.746,0,0,0,399.085,333.2h0a220.2,220.2,0,0,0,65.277-9.846,24.439,24.439,0,0,1,28.959,34.461A252.256,252.256,0,0,1,268.279,496ZM153.31,55.781A219.3,219.3,0,0,0,48,243.718C48,365.181,146.816,464,268.279,464a219.3,219.3,0,0,0,187.938-105.31,252.912,252.912,0,0,1-57.13,6.513h0a250.539,250.539,0,0,1-178.268-74.016,252.147,252.147,0,0,1-67.509-235.4Z"></path>
              </svg>
              <span className="ms-2">Прогноз</span>
            </a>
          </li>

          {/* Настройки */}
          <li className="nav-title mt-3 px-3">Настройки</li>

          <li className="nav-item">
            <a
              className={`nav-link ${activeItem === 'settings-backups' ? 'active' : ''}`}
              href="#"
              onClick={(e) => { e.preventDefault(); handleItemClick('settings-backups') }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="icon me-2" role="img" aria-hidden="true" style={{ width: '16px', height: '16px', fill: 'currentColor' }}>
                <path d="M245.151,168a88,88,0,1,0,88,88A88.1,88.1,0,0,0,245.151,168Zm0,144a56,56,0,1,1,56-56A56.063,56.063,0,0,1,245.151,312Z"></path>
                <path d="M464.7,322.319l-31.77-26.153a193.081,193.081,0,0,0,0-80.332l31.77-26.153a19.941,19.941,0,0,0,4.606-25.439l-32.612-56.483a19.936,19.936,0,0,0-24.337-8.73l-38.561,14.447a192.038,192.038,0,0,0-69.54-40.192L297.49,32.713A19.936,19.936,0,0,0,277.762,16H212.54a19.937,19.937,0,0,0-19.728,16.712L186.05,73.284a192.03,192.03,0,0,0-69.54,40.192L77.945,99.027a19.937,19.937,0,0,0-24.334,8.731L21,164.245a19.94,19.94,0,0,0,4.61,25.438l31.767,26.151a193.081,193.081,0,0,0,0,80.332l-31.77,26.153A19.942,19.942,0,0,0,21,347.758l32.612,56.483a19.937,19.937,0,0,0,24.337,8.73l38.562-14.447a192.03,192.03,0,0,0,69.54,40.192l6.762,40.571A19.937,19.937,0,0,0,212.54,496h65.222a19.936,19.936,0,0,0,19.728-16.712l6.763-40.572a192.038,192.038,0,0,0,69.54-40.192l38.564,14.449a19.938,19.938,0,0,0,24.334-8.731L469.3,347.755A19.939,19.939,0,0,0,464.7,322.319Zm-50.636,57.12-48.109-18.024-7.285,7.334a159.955,159.955,0,0,1-72.625,41.973l-10,2.636L267.6,464h-44.89l-8.442-50.642-10-2.636a159.955,159.955,0,0,1-72.625-41.973l-7.285-7.334L76.241,379.439,53.8,340.562l39.629-32.624-2.7-9.973a160.9,160.9,0,0,1,0-83.93l2.7-9.972L53.8,171.439l22.446-38.878,48.109,18.024,7.285-7.334a159.955,159.955,0,0,1,72.625-41.973l10-2.636L222.706,48H267.6l8.442,50.642,10,2.636a159.955,159.955,0,0,1,72.625,41.973l7.285,7.334,48.109-18.024,22.447,38.877-39.629,32.625,2.7,9.972a160.9,160.9,0,0,1,0,83.93l-2.7,9.973,39.629,32.623Z"></path>
              </svg>
              <span className="ms-2">Бэкапы</span>
            </a>
          </li>
        </ul>

        {/* Footer */}
        <div className="sidebar-footer d-none d-md-flex border-top p-3 justify-content-between align-items-center">
          <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)' }}>v1.0.0</span>
          <button
            className="sidebar-toggler-btn"
            title={sidebarUnfoldable ? 'Развернуть' : 'Свернуть'}
            onClick={toggleSidebarUnfoldable}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="icon icon-sm" role="img" aria-hidden="true" style={{ width: '16px', height: '16px', fill: 'currentColor' }}>
              <path d="M327.086,496.89l-142.6-142.6-11.258-11.15-85.6-85.6.054-.054,11.259-11.367,85.5-85.5.054.054,142.6-142.595L424,114.989,281.506,257.483,424,399.978ZM184.64,309.3l11.266,11.159,131.18,131.181,51.658-51.658L236.251,257.483,378.744,114.989,327.086,63.331,184.694,205.725l-.054-.054-51.813,51.812Z"></path>
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div
        className="d-flex flex-column flex-grow-1"
        style={{
          marginLeft: sidebarUnfoldable ? '70px' : '260px',
          transition: 'margin-left 0.3s'
        }}
      >
        {/* Header */}
        <header className="header header-sticky bg-body border-bottom mb-4" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div className="container-fluid">
            <ul className="header-nav" role="navigation">
              {/* Sidebar Toggler */}
              <button
                type="button"
                className="header-toggler"
                style={{ marginInlineStart: '-14px', color: 'var(--text-primary)' }}
                onClick={toggleSidebarUnfoldable}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="icon icon-lg" role="img" aria-hidden="true" style={{ width: '24px', height: '24px', fill: 'currentColor' }}>
                  <path d="M327.086,496.89l-142.6-142.6-11.258-11.15-85.6-85.6.054-.054,11.259-11.367,85.5-85.5.054.054,142.6-142.595L424,114.989,281.506,257.483,424,399.978ZM184.64,309.3l11.266,11.159,131.18,131.181,51.658-51.658L236.251,257.483,378.744,114.989,327.086,63.331,184.694,205.725l-.054-.054-51.813,51.812Z"></path>
                </svg>
              </button>

              {/* Theme Toggle */}
              <li className="nav-item dropdown ms-3">
                <a
                  href="#"
                  className="nav-link"
                  aria-expanded="false"
                  role="button"
                  color="link"
                  style={{ color: 'var(--text-primary)' }}
                  onClick={(e) => { e.preventDefault() }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="icon icon-lg" role="img" aria-hidden="true" style={{ width: '24px', height: '24px', fill: 'currentColor' }}>
                    <path d="M268.279,496c-67.574,0-130.978-26.191-178.534-73.745S16,311.293,16,243.718A252.252,252.252,0,0,1,154.183,18.676a24.44,24.44,0,0,1,34.46,28.958,220.12,220.12,0,0,0,54.8,220.923A218.746,218.746,0,0,0,399.085,333.2h0a220.2,220.2,0,0,0,65.277-9.846,24.439,24.439,0,0,1,28.959,34.461A252.256,252.256,0,0,1,268.279,496ZM153.31,55.781A219.3,219.3,0,0,0,48,243.718C48,365.181,146.816,464,268.279,464a219.3,219.3,0,0,0,187.938-105.31,252.912,252.912,0,0,1-57.13,6.513h0a250.539,250.539,0,0,1-178.268-74.016,252.147,252.147,0,0,1-67.509-235.4Z"></path>
                  </svg>
                </a>
                <ul className="dropdown-menu" role="menu">
                  <li>
                    <button
                      className={`dropdown-item ${theme === 'light' ? 'active' : ''}`}
                      type="button"
                      onClick={() => handleThemeChange('light')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="icon me-2" role="img" aria-hidden="true" style={{ width: '16px', height: '16px', fill: 'currentColor' }}>
                        <path d="M268.279,496c-67.574,0-130.978-26.191-178.534-73.745S16,311.293,16,243.718A252.252,252.252,0,0,1,154.183,18.676a24.44,24.44,0,0,1,34.46,28.958,220.12,220.12,0,0,0,54.8,220.923A218.746,218.746,0,0,0,399.085,333.2h0a220.2,220.2,0,0,0,65.277-9.846,24.439,24.439,0,0,1,28.959,34.461A252.256,252.256,0,0,1,268.279,496ZM153.31,55.781A219.3,219.3,0,0,0,48,243.718C48,365.181,146.816,464,268.279,464a219.3,219.3,0,0,0,187.938-105.31,252.912,252.912,0,0,1-57.13,6.513h0a250.539,250.539,0,0,1-178.268-74.016,252.147,252.147,0,0,1-67.509-235.4Z"></path>
                      </svg>
                      Светлая
                    </button>
                  </li>
                  <li>
                    <button
                      className={`dropdown-item ${theme === 'dark' ? 'active' : ''}`}
                      type="button"
                      onClick={() => handleThemeChange('dark')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="icon me-2" role="img" aria-hidden="true" style={{ width: '16px', height: '16px', fill: 'currentColor' }}>
                        <path d="M268.279,496c-67.574,0-130.978-26.191-178.534-73.745S16,311.293,16,243.718A252.252,252.252,0,0,1,154.183,18.676a24.44,24.44,0,0,1,34.46,28.958,220.12,220.12,0,0,0,54.8,220.923A218.746,218.746,0,0,0,399.085,333.2h0a220.2,220.2,0,0,0,65.277-9.846,24.439,24.439,0,0,1,28.959,34.461A252.256,252.256,0,0,1,268.279,496ZM153.31,55.781A219.3,219.3,0,0,0,48,243.718C48,365.181,146.816,464,268.279,464a219.3,219.3,0,0,0,187.938-105.31,252.912,252.912,0,0,1-57.13,6.513h0a250.539,250.539,0,0,1-178.268-74.016,252.147,252.147,0,0,1-67.509-235.4Z"></path>
                      </svg>
                      Тёмная
                    </button>
                  </li>
                </ul>
              </li>

              {/* GitHub Link */}
              <li className="nav-item d-none d-sm-block ms-3">
                <a
                  className="nav-link d-none d-sm-block ms-3"
                  href="https://github.com/"
                  target="_blank"
                  rel="noopener"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="icon icon-lg" role="img" aria-hidden="true" style={{ width: '24px', height: '24px', fill: 'currentColor' }}>
                    <path d="M16 0.396c-8.839 0-16 7.167-16 16 0 7.073 4.584 13.068 10.937 15.183 0.803 0.151 1.093-0.344 1.093-0.772 0-0.38-0.009-1.385-0.015-2.719-4.453 0.964-5.391-2.151-5.391-2.151-0.729-1.844-1.781-2.339-1.781-2.339-1.448-0.989 0.115-0.968 0.115-0.968 1.604 0.109 2.448 1.645 2.448 1.645 1.427 2.448 3.744 1.74 4.661 1.328 0.14-1.031 0.557-1.74 1.011-2.135-3.552-0.401-7.287-1.776-7.287-7.907 0-1.751 0.62-3.177 1.645-4.297-0.177-0.401-0.719-2.031 0.141-4.235 0 0 1.339-0.427 4.4 1.641 1.281-0.355 2.641-0.532 4-0.541 1.36 0.009 2.719 0.187 4 0.541 3.043-2.068 4.381-1.641 4.381-1.641 0.859 2.204 0.317 3.833 0.161 4.235 1.015 1.12 1.635 2.547 1.635 4.297 0 6.145-3.74 7.5-7.296 7.891 0.556 0.479 1.077 1.464 1.077 2.959 0 2.14-0.020 3.864-0.020 4.385 0 0.416 0.28 0.916 1.104 0.755 6.4-2.093 10.979-8.093 10.979-15.156 0-8.833-7.161-16-16-16z"></path>
                  </svg>
                </a>
              </li>
            </ul>
          </div>
        </header>

        {/* Content */}
        <div className="flex-grow-1 p-3">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Layout
