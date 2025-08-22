class KeywordManager {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 50;
        this.searchTerm = '';
        this.filterProcessed = '';
        this.selectedKeywords = new Set();
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadStatistics();
        this.loadKeywords();
        
        // Auto refresh mỗi 30 giây
        setInterval(() => {
            this.loadStatistics();
        }, 30000);
    }

    bindEvents() {
        // Tìm kiếm
        document.getElementById('search-btn').addEventListener('click', () => {
            this.searchTerm = document.getElementById('search-input').value;
            this.currentPage = 1;
            this.loadKeywords();
        });

        document.getElementById('search-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchTerm = e.target.value;
                this.currentPage = 1;
                this.loadKeywords();
            }
        });

        // Bộ lọc
        document.getElementById('filter-processed').addEventListener('change', (e) => {
            this.filterProcessed = e.target.value;
            this.currentPage = 1;
            this.loadKeywords();
        });

        document.getElementById('items-per-page').addEventListener('change', (e) => {
            this.itemsPerPage = parseInt(e.target.value);
            this.currentPage = 1;
            this.loadKeywords();
        });

        // Làm mới
        document.getElementById('refresh-btn').addEventListener('click', () => {
            this.loadStatistics();
            this.loadKeywords();
        });

        // Thêm keyword
        document.getElementById('save-keyword-btn').addEventListener('click', () => {
            this.addKeyword();
        });

        // Cập nhật keyword
        document.getElementById('update-keyword-btn').addEventListener('click', () => {
            this.updateKeyword();
        });

        // Reset tất cả
        document.getElementById('reset-all-btn').addEventListener('click', () => {
            if (confirm('Bạn có chắc muốn reset tất cả keywords về trạng thái chưa xử lý?')) {
                this.resetAllKeywords();
            }
        });

        // Xóa đã chọn
        document.getElementById('delete-selected-btn').addEventListener('click', () => {
            if (this.selectedKeywords.size === 0) {
                alert('Vui lòng chọn ít nhất một keyword để xóa');
                return;
            }
            if (confirm(`Bạn có chắc muốn xóa ${this.selectedKeywords.size} keywords đã chọn?`)) {
                this.deleteSelectedKeywords();
            }
        });

        // Select all
        document.getElementById('select-all').addEventListener('change', (e) => {
            this.toggleSelectAll(e.target.checked);
        });

        document.getElementById('select-all-header').addEventListener('change', (e) => {
            this.toggleSelectAll(e.target.checked);
        });
    }

    async loadStatistics() {
        try {
            const response = await fetch('/api/statistics');
            const stats = await response.json();
            
            document.getElementById('total-keywords').textContent = stats.total;
            document.getElementById('processed-keywords').textContent = stats.processed;
            document.getElementById('unprocessed-keywords').textContent = stats.unprocessed;
            
            const progress = stats.total > 0 ? Math.round((stats.processed / stats.total) * 100) : 0;
            document.getElementById('progress-percent').textContent = progress + '%';
            
        } catch (error) {
            console.error('Lỗi tải thống kê:', error);
        }
    }

    async loadKeywords() {
        try {
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.itemsPerPage,
                search: this.searchTerm,
                processed: this.filterProcessed
            });

            const response = await fetch(`/api/keywords?${params}`);
            const data = await response.json();
            
            this.renderKeywords(data.keywords);
            this.renderPagination(data.pagination);
            
        } catch (error) {
            console.error('Lỗi tải keywords:', error);
        }
    }

    renderKeywords(keywords) {
        const tbody = document.getElementById('keywords-table-body');
        tbody.innerHTML = '';

        keywords.forEach(keyword => {
            const row = document.createElement('tr');
            
            const statusClass = keyword.processed ? 'status-processed' : 'status-unprocessed';
            const statusText = keyword.processed ? 'Đã xử lý' : 'Chưa xử lý';
            const statusIcon = keyword.processed ? 'fas fa-check' : 'fas fa-clock';
            
            const createdAt = new Date(keyword.created_at).toLocaleString('vi-VN');
            
            row.innerHTML = `
                <td>
                    <input type="checkbox" class="form-check-input keyword-checkbox" 
                           value="${keyword.id}" ${this.selectedKeywords.has(keyword.id) ? 'checked' : ''}>
                </td>
                <td>${keyword.id}</td>
                <td class="text-break">${this.escapeHtml(keyword.keyword)}</td>
                <td class="text-break">${keyword.source_keyword ? this.escapeHtml(keyword.source_keyword) : '-'}</td>
                <td>
                    <span class="keyword-status ${statusClass}">
                        <i class="${statusIcon}"></i> ${statusText}
                    </span>
                </td>
                <td>${createdAt}</td>
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        <button type="button" class="btn btn-outline-primary" 
                                onclick="keywordManager.editKeyword(${keyword.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn btn-outline-danger" 
                                onclick="keywordManager.deleteKeyword(${keyword.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            
            tbody.appendChild(row);
        });

        // Bind checkbox events
        document.querySelectorAll('.keyword-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const id = parseInt(e.target.value);
                if (e.target.checked) {
                    this.selectedKeywords.add(id);
                } else {
                    this.selectedKeywords.delete(id);
                }
                this.updateSelectAllState();
            });
        });
    }

    renderPagination(pagination) {
        const paginationEl = document.getElementById('pagination');
        paginationEl.innerHTML = '';

        if (pagination.totalPages <= 1) return;

        // Previous button
        const prevLi = document.createElement('li');
        prevLi.className = `page-item ${pagination.page === 1 ? 'disabled' : ''}`;
        prevLi.innerHTML = `<a class="page-link" href="#" data-page="${pagination.page - 1}">Trước</a>`;
        paginationEl.appendChild(prevLi);

        // Page numbers
        const startPage = Math.max(1, pagination.page - 2);
        const endPage = Math.min(pagination.totalPages, pagination.page + 2);

        for (let i = startPage; i <= endPage; i++) {
            const li = document.createElement('li');
            li.className = `page-item ${i === pagination.page ? 'active' : ''}`;
            li.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
            paginationEl.appendChild(li);
        }

        // Next button
        const nextLi = document.createElement('li');
        nextLi.className = `page-item ${pagination.page === pagination.totalPages ? 'disabled' : ''}`;
        nextLi.innerHTML = `<a class="page-link" href="#" data-page="${pagination.page + 1}">Sau</a>`;
        paginationEl.appendChild(nextLi);

        // Bind pagination events
        paginationEl.addEventListener('click', (e) => {
            e.preventDefault();
            if (e.target.tagName === 'A' && !e.target.parentElement.classList.contains('disabled')) {
                this.currentPage = parseInt(e.target.dataset.page);
                this.loadKeywords();
            }
        });
    }

    toggleSelectAll(checked) {
        document.querySelectorAll('.keyword-checkbox').forEach(checkbox => {
            checkbox.checked = checked;
            const id = parseInt(checkbox.value);
            if (checked) {
                this.selectedKeywords.add(id);
            } else {
                this.selectedKeywords.delete(id);
            }
        });
        
        document.getElementById('select-all').checked = checked;
        document.getElementById('select-all-header').checked = checked;
    }

    updateSelectAllState() {
        const checkboxes = document.querySelectorAll('.keyword-checkbox');
        const checkedCount = document.querySelectorAll('.keyword-checkbox:checked').length;
        
        const selectAllCheckboxes = [
            document.getElementById('select-all'),
            document.getElementById('select-all-header')
        ];
        
        selectAllCheckboxes.forEach(checkbox => {
            checkbox.checked = checkedCount === checkboxes.length && checkboxes.length > 0;
            checkbox.indeterminate = checkedCount > 0 && checkedCount < checkboxes.length;
        });
    }

    async addKeyword() {
        const keyword = document.getElementById('new-keyword').value.trim();
        const sourceKeyword = document.getElementById('new-source-keyword').value.trim();

        if (!keyword) {
            alert('Vui lòng nhập keyword');
            return;
        }

        try {
            const response = await fetch('/api/keywords', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    keyword,
                    source_keyword: sourceKeyword || null
                })
            });

            const result = await response.json();

            if (response.ok) {
                alert('Thêm keyword thành công');
                document.getElementById('add-keyword-form').reset();
                bootstrap.Modal.getInstance(document.getElementById('addKeywordModal')).hide();
                this.loadStatistics();
                this.loadKeywords();
            } else {
                alert(result.error || 'Có lỗi xảy ra');
            }
        } catch (error) {
            console.error('Lỗi thêm keyword:', error);
            alert('Có lỗi xảy ra khi thêm keyword');
        }
    }

    async editKeyword(id) {
        try {
            // Lấy thông tin keyword hiện tại
            const response = await fetch('/api/keywords');
            const data = await response.json();
            const keyword = data.keywords.find(k => k.id === id);

            if (!keyword) {
                alert('Không tìm thấy keyword');
                return;
            }

            // Điền thông tin vào form
            document.getElementById('edit-keyword-id').value = keyword.id;
            document.getElementById('edit-keyword').value = keyword.keyword;
            document.getElementById('edit-source-keyword').value = keyword.source_keyword || '';
            document.getElementById('edit-processed').value = keyword.processed.toString();

            // Hiển thị modal
            new bootstrap.Modal(document.getElementById('editKeywordModal')).show();

        } catch (error) {
            console.error('Lỗi lấy thông tin keyword:', error);
            alert('Có lỗi xảy ra khi lấy thông tin keyword');
        }
    }

    async updateKeyword() {
        const id = document.getElementById('edit-keyword-id').value;
        const keyword = document.getElementById('edit-keyword').value.trim();
        const sourceKeyword = document.getElementById('edit-source-keyword').value.trim();
        const processed = document.getElementById('edit-processed').value === 'true';

        if (!keyword) {
            alert('Vui lòng nhập keyword');
            return;
        }

        try {
            const response = await fetch(`/api/keywords/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    keyword,
                    source_keyword: sourceKeyword || null,
                    processed
                })
            });

            const result = await response.json();

            if (response.ok) {
                alert('Cập nhật keyword thành công');
                bootstrap.Modal.getInstance(document.getElementById('editKeywordModal')).hide();
                this.loadStatistics();
                this.loadKeywords();
            } else {
                alert(result.error || 'Có lỗi xảy ra');
            }
        } catch (error) {
            console.error('Lỗi cập nhật keyword:', error);
            alert('Có lỗi xảy ra khi cập nhật keyword');
        }
    }

    async deleteKeyword(id) {
        if (!confirm('Bạn có chắc muốn xóa keyword này?')) {
            return;
        }

        try {
            const response = await fetch(`/api/keywords/${id}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (response.ok) {
                alert('Xóa keyword thành công');
                this.selectedKeywords.delete(id);
                this.loadStatistics();
                this.loadKeywords();
            } else {
                alert(result.error || 'Có lỗi xảy ra');
            }
        } catch (error) {
            console.error('Lỗi xóa keyword:', error);
            alert('Có lỗi xảy ra khi xóa keyword');
        }
    }

    async deleteSelectedKeywords() {
        const ids = Array.from(this.selectedKeywords);

        try {
            const response = await fetch('/api/keywords', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ids })
            });

            const result = await response.json();

            if (response.ok) {
                alert(result.message);
                this.selectedKeywords.clear();
                this.loadStatistics();
                this.loadKeywords();
            } else {
                alert(result.error || 'Có lỗi xảy ra');
            }
        } catch (error) {
            console.error('Lỗi xóa keywords:', error);
            alert('Có lỗi xảy ra khi xóa keywords');
        }
    }

    async resetAllKeywords() {
        try {
            const response = await fetch('/api/keywords/reset', {
                method: 'POST'
            });

            const result = await response.json();

            if (response.ok) {
                alert(result.message);
                this.loadStatistics();
                this.loadKeywords();
            } else {
                alert(result.error || 'Có lỗi xảy ra');
            }
        } catch (error) {
            console.error('Lỗi reset keywords:', error);
            alert('Có lỗi xảy ra khi reset keywords');
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Khởi tạo
const keywordManager = new KeywordManager();
