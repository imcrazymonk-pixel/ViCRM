import { useState, useEffect } from 'react'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import axios from 'axios'
import { formatBytes, formatDate } from '@core/utils/format'

const API_URL = 'http://localhost:8002/api'

export const BackupManager = ({ onClose }) => {
  const [backups, setBackups] = useState([])
  const [loading, setLoading] = useState(false)

  const loadBackups = async () => {
    try {
      const res = await axios.get(`${API_URL}/backup/list`)
      setBackups(res.data)
    } catch (err) {
      console.error('Ошибка загрузки бэкапов:', err)
    }
  }

  useEffect(() => {
    loadBackups()
  }, [])

  const exportBackup = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/backup/export`, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      
      const contentDisposition = response.headers['content-disposition']
      let filename = 'backup.json'
      if (contentDisposition) {
        const match = contentDisposition.match(/filename=(.+)/)
        if (match) {
          filename = match[1]
        }
      }
      
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      toast.success('Бэкап экспортирован!')
      loadBackups()
    } catch (err) {
      toast.error('Ошибка экспорта: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const importBackup = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return
      
      if (!confirm('ВНИМАНИЕ: Все текущие данные будут заменены данными из бэкапа. Продолжить?')) {
        return
      }
      
      try {
        setLoading(true)
        const reader = new FileReader()
        reader.onload = async (event) => {
          try {
            const backupData = JSON.parse(event.target.result)
            const res = await axios.post(`${API_URL}/backup/import`, backupData)
            toast.success(res.data.message || 'Данные восстановлены!')
            setTimeout(() => window.location.reload(), 1500)
          } catch (err) {
            toast.error(err.response?.data?.detail || 'Ошибка импорта')
          } finally {
            setLoading(false)
          }
        }
        reader.readAsText(file)
      } catch (err) {
        toast.error('Ошибка чтения файла')
        setLoading(false)
      }
    }
    
    input.click()
  }

  const deleteBackup = async (filename) => {
    if (!confirm(`Удалить бэкап "${filename}"?`)) return
    
    try {
      await axios.delete(`${API_URL}/backup/${filename}`)
      toast.success('Бэкап удалён')
      loadBackups()
    } catch (err) {
      toast.error('Ошибка удаления')
    }
  }

  return (
    <div className="backup-manager">
      <div className="content-header mb-3">
        <h4><i className="bi bi-cloud-arrow-up"></i> Бэкапы и восстановление</h4>
        <button className="btn btn-outline-primary btn-sm" onClick={onClose}>
          <i className="bi bi-x-lg"></i> Закрыть
        </button>
      </div>

      <div className="backup-actions mb-4">
        <div className="row">
          <div className="col-md-6">
            <div className="action-card">
              <div className="card-header">
                <h5><i className="bi bi-download"></i> Экспорт данных</h5>
              </div>
              <p className="text-muted small mb-3">
                Сохраните все данные приложения в JSON файл для резервного копирования или переноса.
              </p>
              <button
                className="btn btn-primary w-100"
                onClick={exportBackup}
                disabled={loading}
              >
                <i className="bi bi-file-earmark-arrow-down"></i>
                {loading ? 'Экспорт...' : 'Экспортировать бэкап'}
              </button>
            </div>
          </div>

          <div className="col-md-6">
            <div className="action-card">
              <div className="card-header">
                <h5><i className="bi bi-upload"></i> Импорт данных</h5>
              </div>
              <p className="text-muted small mb-3">
                Восстановите данные из ранее сохранённого бэкапа. Все текущие данные будут заменены.
              </p>
              <button
                className="btn btn-danger w-100"
                onClick={importBackup}
                disabled={loading}
              >
                <i className="bi bi-file-earmark-arrow-up"></i>
                {loading ? 'Импорт...' : 'Восстановить из бэкапа'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="action-card">
        <div className="card-header">
          <h5><i className="bi bi-folder"></i> Сохранённые бэкапы</h5>
          <button className="btn-icon" onClick={loadBackups} title="Обновить">
            <i className="bi bi-arrow-clockwise"></i>
          </button>
        </div>

        {backups.length === 0 ? (
          <div className="empty-state">
            <i className="bi bi-folder-x"></i>
            <p>Нет сохранённых бэкапов</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Файл</th>
                <th>Размер</th>
                <th>Дата создания</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {backups.map(backup => (
                <tr key={backup.filename}>
                  <td>
                    <i className="bi bi-file-earmark-json text-primary"></i>
                    {' '}{backup.filename}
                  </td>
                  <td>{formatBytes(backup.size)}</td>
                  <td>{formatDate(backup.created)}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => deleteBackup(backup.filename)}
                      title="Удалить"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ToastContainer />
    </div>
  )
}
