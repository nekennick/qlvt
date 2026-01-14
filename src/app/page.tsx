import { getDashboardStats, getImportHistory } from "@/actions/materials";

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  const { imports } = await getImportHistory(1, 5);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date));
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold gradient-text mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Tổng vật tư</p>
              <p className="stat-value">{stats.totalMaterials}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Còn hàng</p>
              <p className="stat-value text-green-400" style={{ WebkitTextFillColor: '#22c55e' }}>
                {stats.activeMaterials}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Hết hàng</p>
              <p className="stat-value text-red-400" style={{ WebkitTextFillColor: '#ef4444' }}>
                {stats.inactiveMaterials}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Tổng giá trị</p>
              <p className="text-xl font-bold text-amber-400">
                {formatCurrency(stats.totalValue)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Imports */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Lịch sử Import gần đây</h2>
          <a href="/lich-su" className="text-indigo-400 hover:text-indigo-300 text-sm">
            Xem tất cả →
          </a>
        </div>

        {imports.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-400">Chưa có dữ liệu import</p>
            <a href="/import" className="btn-primary inline-block mt-4">
              Import ngay
            </a>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>File</th>
                <th>Tổng</th>
                <th>Mới</th>
                <th>Cập nhật</th>
                <th>Hết hàng</th>
              </tr>
            </thead>
            <tbody>
              {imports.map((imp) => (
                <tr key={imp.id}>
                  <td>{formatDate(imp.importedAt)}</td>
                  <td className="font-medium">{imp.fileName}</td>
                  <td>{imp.totalItems}</td>
                  <td>
                    <span className="badge badge-success">+{imp.newItems}</span>
                  </td>
                  <td>
                    <span className="badge badge-info">{imp.updatedItems}</span>
                  </td>
                  <td>
                    <span className="badge badge-danger">-{imp.removedItems}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
