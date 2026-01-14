-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "maVT" TEXT NOT NULL,
    "tenVT" TEXT NOT NULL,
    "dvt" TEXT,
    "soLo" TEXT,
    "noiSX" TEXT,
    "chatLuong" TEXT,
    "soLuong" REAL NOT NULL DEFAULT 0,
    "donGia" REAL,
    "thanhTien" REAL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ImportHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileName" TEXT NOT NULL,
    "importedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalItems" INTEGER NOT NULL,
    "newItems" INTEGER NOT NULL DEFAULT 0,
    "updatedItems" INTEGER NOT NULL DEFAULT 0,
    "removedItems" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "MaterialChange" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "materialId" TEXT NOT NULL,
    "importId" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,
    "oldQuantity" REAL,
    "newQuantity" REAL,
    "quantityDiff" REAL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MaterialChange_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MaterialChange_importId_fkey" FOREIGN KEY ("importId") REFERENCES "ImportHistory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Material_maVT_key" ON "Material"("maVT");
