import React, { useState, useRef } from 'react';
import { X, UploadCloud, Globe, FileText } from 'lucide-react';
import { AssetType, Collection, Language } from '../types/library';

interface AddReferenceModalProps {
  open: boolean;
  lang: Language;
  collections: Collection[];
  defaultCollectionId: string;
  onClose: () => void;
  onImportFiles: (files: FileList, collectionId: string) => void;
  onAddUrlBookmark: (payload: {
    title: string;
    sourceUrl: string;
    type: AssetType;
    collectionId: string;
    tags: string[];
    notes: string;
    docContent?: string;
  }) => void;
}

export const AddReferenceModal: React.FC<AddReferenceModalProps> = ({
  open,
  lang,
  collections,
  defaultCollectionId,
  onClose,
  onImportFiles,
  onAddUrlBookmark,
}) => {
  const [tab, setTab] = useState<'file' | 'url' | 'note'>('file');
  const [collectionId, setCollectionId] = useState(
    defaultCollectionId || collections[0]?.id || 'col-saas'
  );
  const [title, setTitle] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [assetType, setAssetType] = useState<AssetType>('web');
  const [tagsRaw, setTagsRaw] = useState('');
  const [notes, setNotes] = useState('');
  const [docContent, setDocContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleSubmitBookmark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddUrlBookmark({
      title: title.trim(),
      sourceUrl: sourceUrl.trim(),
      type: tab === 'note' ? 'doc' : assetType,
      collectionId,
      tags: tagsRaw
        .split(/[,，\s]+/)
        .map((s) => s.trim())
        .filter(Boolean),
      notes: notes.trim(),
      docContent: tab === 'note' ? docContent.trim() : undefined,
    });
    setTitle('');
    setSourceUrl('');
    setTagsRaw('');
    setNotes('');
    setDocContent('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-[10px] bg-white dark:bg-[#282828] border border-black/[0.1] dark:border-white/[0.1] shadow-2xl overflow-hidden"
      >
        <div className="h-12 px-5 border-b border-black/[0.07] dark:border-white/[0.07] flex items-center justify-between">
          <h2 className="font-display font-semibold text-sm text-neutral-900 dark:text-white">
            {lang === 'zh' ? '添加设计参考到 Windows 本地库' : 'Add Reference to Library'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded flex items-center justify-center text-neutral-500 hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="px-5 pt-4">
          <div className="grid grid-cols-3 gap-1 p-1 rounded-[6px] bg-black/[0.045] dark:bg-white/[0.06]">
            <button
              type="button"
              onClick={() => setTab('file')}
              className={`h-8 rounded-[4px] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                tab === 'file'
                  ? 'bg-white dark:bg-[#383838] text-neutral-900 dark:text-white shadow-2xs'
                  : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>{lang === 'zh' ? '本地文件' : 'Local Files'}</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('url')}
              className={`h-8 rounded-[4px] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                tab === 'url'
                  ? 'bg-white dark:bg-[#383838] text-neutral-900 dark:text-white shadow-2xs'
                  : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{lang === 'zh' ? '网页书签' : 'Web Link'}</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('note')}
              className={`h-8 rounded-[4px] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                tab === 'note'
                  ? 'bg-white dark:bg-[#383838] text-neutral-900 dark:text-white shadow-2xs'
                  : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{lang === 'zh' ? '规范文档' : 'Spec Note'}</span>
            </button>
          </div>
        </div>

        <div className="p-5">
          {/* Collection Selector */}
          <div className="mb-4">
            <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
              {lang === 'zh' ? '目标合集' : 'Target Collection'}
            </label>
            <select
              value={collectionId}
              onChange={(e) => setCollectionId(e.target.value)}
              className="w-full h-9 px-3 text-xs rounded-[5px] bg-neutral-50 dark:bg-[#1f1f1f] border border-black/10 dark:border-white/10 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-[#0067C0]"
            >
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {lang === 'zh' ? c.nameZh : c.nameEn}
                </option>
              ))}
            </select>
          </div>

          {tab === 'file' ? (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*,audio/*,.pdf,.md,.txt"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    onImportFiles(e.target.files, collectionId);
                    onClose();
                  }
                }}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-10 px-6 rounded-lg border-2 border-dashed border-black/15 dark:border-white/15 hover:border-[#0067C0] dark:hover:border-[#4CC2FF] bg-neutral-50/60 dark:bg-[#202020] text-center transition-colors"
              >
                <UploadCloud className="w-8 h-8 mx-auto mb-2.5 text-[#0067C0] dark:text-[#4CC2FF]" />
                <div className="text-sm font-medium text-neutral-900 dark:text-white">
                  {lang === 'zh'
                    ? '点击从 Windows 资源管理器选择文件'
                    : 'Choose files from Windows Explorer'}
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  {lang === 'zh'
                    ? '支持批量导入图片、视频、音频与 Markdown/文档，自动提取配色并保存至 IndexedDB'
                    : 'Supports images, videos, audio & docs with auto color extraction'}
                </p>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitBookmark} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
                  {lang === 'zh' ? '标题' : 'Title'}
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    tab === 'url'
                      ? lang === 'zh'
                        ? '例如：Linear — 产品路线图官网'
                        : 'e.g. Linear — Product Landing'
                      : lang === 'zh'
                        ? '例如：字号与行高阶梯备忘'
                        : 'e.g. Type Scale Reference'
                  }
                  className="w-full h-9 px-3 text-xs rounded-[5px] bg-neutral-50 dark:bg-[#1f1f1f] border border-black/10 dark:border-white/10 focus:outline-none focus:border-[#0067C0]"
                />
              </div>

              {tab === 'url' && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
                      URL
                    </label>
                    <input
                      type="url"
                      required
                      value={sourceUrl}
                      onChange={(e) => setSourceUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full h-9 px-3 text-xs rounded-[5px] bg-neutral-50 dark:bg-[#1f1f1f] border border-black/10 dark:border-white/10 focus:outline-none focus:border-[#0067C0]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
                      {lang === 'zh' ? '分类' : 'Type'}
                    </label>
                    <select
                      value={assetType}
                      onChange={(e) => setAssetType(e.target.value as AssetType)}
                      className="w-full h-9 px-2 text-xs rounded-[5px] bg-neutral-50 dark:bg-[#1f1f1f] border border-black/10 dark:border-white/10 focus:outline-none"
                    >
                      <option value="web">{lang === 'zh' ? '网页' : 'Web'}</option>
                      <option value="ui">{lang === 'zh' ? '界面' : 'UI'}</option>
                      <option value="print">{lang === 'zh' ? '平面' : 'Print'}</option>
                    </select>
                  </div>
                </div>
              )}

              {tab === 'note' && (
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
                    {lang === 'zh' ? '正文内容' : 'Document Content'}
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={docContent}
                    onChange={(e) => setDocContent(e.target.value)}
                    placeholder={
                      lang === 'zh'
                        ? '输入设计规范、配色数值或排版原则…'
                        : 'Write design rules, tokens, or notes…'
                    }
                    className="w-full p-2.5 text-xs rounded-[5px] bg-neutral-50 dark:bg-[#1f1f1f] border border-black/10 dark:border-white/10 focus:outline-none focus:border-[#0067C0]"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
                  {lang === 'zh' ? '标签（空格或逗号分隔）' : 'Tags (comma separated)'}
                </label>
                <input
                  type="text"
                  value={tagsRaw}
                  onChange={(e) => setTagsRaw(e.target.value)}
                  placeholder="SaaS, Typography, Dark Mode"
                  className="w-full h-9 px-3 text-xs rounded-[5px] bg-neutral-50 dark:bg-[#1f1f1f] border border-black/10 dark:border-white/10 focus:outline-none focus:border-[#0067C0]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
                  {lang === 'zh' ? '简短备注' : 'Notes'}
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-[5px] bg-neutral-50 dark:bg-[#1f1f1f] border border-black/10 dark:border-white/10 focus:outline-none focus:border-[#0067C0]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-8 px-4 rounded-[5px] text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-black/[0.05] dark:hover:bg-white/[0.08]"
                >
                  {lang === 'zh' ? '取消' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="h-8 px-4 rounded-[5px] bg-[#0067C0] dark:bg-[#4CC2FF] text-white dark:text-neutral-950 text-xs font-semibold"
                >
                  {lang === 'zh' ? '保存入库' : 'Save to Library'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
