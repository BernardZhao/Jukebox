package main

// Info is an object representing the JSON returned from a -J youtube-dl download
type Info struct {
	ID          string      `json:"id"`
	URL         string      `json:"url"`
	Uploader    string      `json:"uploader"`
	UploaderID  string      `json:"uploader_id"`
	UploaderURL string      `json:"uploader_url"`
	UploadDate  string      `json:"upload_date"`
	License     string      `json:"license"`
	Creator     interface{} `json:"creator"`
	Title       string      `json:"title"`
	AltTitle    interface{} `json:"alt_title"`
	Thumbnail   string      `json:"thumbnail"`
	Description string      `json:"description"`
	Categories  []string    `json:"categories"`
	Tags        []string    `json:"tags"`
	Subtitles   struct {
	} `json:"subtitles"`
	AutomaticCaptions struct {
	} `json:"automatic_captions"`
	Duration      float32     `json:"duration"`
	AgeLimit      int         `json:"age_limit"`
	Annotations   interface{} `json:"annotations"`
	Chapters      interface{} `json:"chapters"`
	WebpageURL    string      `json:"webpage_url"`
	ViewCount     int         `json:"view_count"`
	LikeCount     int         `json:"like_count"`
	DislikeCount  int         `json:"dislike_count"`
	AverageRating float64     `json:"average_rating"`
	Formats       []struct {
		Ext         string      `json:"ext"`
		FormatNote  string      `json:"format_note"`
		Acodec      string      `json:"acodec"`
		Abr         int         `json:"abr,omitempty"`
		Container   string      `json:"container,omitempty"`
		FormatID    string      `json:"format_id"`
		URL         string      `json:"url"`
		ManifestURL string      `json:"manifest_url,omitempty"`
		Width       interface{} `json:"width,omitempty"`
		Height      interface{} `json:"height,omitempty"`
		Tbr         float64     `json:"tbr,omitempty"`
		Asr         int         `json:"asr,omitempty"`
		Fps         interface{} `json:"fps,omitempty"`
		Language    interface{} `json:"language,omitempty"`
		Filesize    int         `json:"filesize,omitempty"`
		Vcodec      string      `json:"vcodec"`
		Format      string      `json:"format"`
		Protocol    string      `json:"protocol"`
		HTTPHeaders struct {
			UserAgent      string `json:"User-Agent"`
			AcceptCharset  string `json:"Accept-Charset"`
			Accept         string `json:"Accept"`
			AcceptEncoding string `json:"Accept-Encoding"`
			AcceptLanguage string `json:"Accept-Language"`
		} `json:"http_headers"`
		PlayerURL  string `json:"player_url,omitempty"`
		Resolution string `json:"resolution,omitempty"`
	} `json:"formats"`
	IsLive             interface{} `json:"is_live"`
	StartTime          interface{} `json:"start_time"`
	EndTime            interface{} `json:"end_time"`
	Series             interface{} `json:"series"`
	SeasonNumber       interface{} `json:"season_number"`
	EpisodeNumber      interface{} `json:"episode_number"`
	Extractor          string      `json:"extractor"`
	WebpageURLBasename string      `json:"webpage_url_basename"`
	ExtractorKey       string      `json:"extractor_key"`
	Playlist           interface{} `json:"playlist"`
	PlaylistIndex      interface{} `json:"playlist_index"`
	Thumbnails         []struct {
		URL string `json:"url"`
		ID  string `json:"id"`
	} `json:"thumbnails"`
	DisplayID          string      `json:"display_id"`
	RequestedSubtitles interface{} `json:"requested_subtitles"`
	RequestedFormats   []struct {
		Ext         string      `json:"ext"`
		Height      int         `json:"height,omitempty"`
		FormatNote  string      `json:"format_note"`
		Vcodec      string      `json:"vcodec"`
		FormatID    string      `json:"format_id"`
		URL         string      `json:"url"`
		ManifestURL string      `json:"manifest_url,omitempty"`
		Width       int         `json:"width,omitempty"`
		Tbr         float64     `json:"tbr"`
		Asr         interface{} `json:"asr,omitempty"`
		Fps         int         `json:"fps,omitempty"`
		Language    interface{} `json:"language,omitempty"`
		Filesize    int         `json:"filesize"`
		Acodec      string      `json:"acodec"`
		Format      string      `json:"format"`
		Protocol    string      `json:"protocol"`
		HTTPHeaders struct {
			UserAgent      string `json:"User-Agent"`
			AcceptCharset  string `json:"Accept-Charset"`
			Accept         string `json:"Accept"`
			AcceptEncoding string `json:"Accept-Encoding"`
			AcceptLanguage string `json:"Accept-Language"`
		} `json:"http_headers"`
		PlayerURL string `json:"player_url,omitempty"`
		Abr       int    `json:"abr,omitempty"`
	} `json:"requested_formats"`
	Format         string      `json:"format"`
	FormatID       string      `json:"format_id"`
	Width          int         `json:"width"`
	Height         int         `json:"height"`
	Resolution     interface{} `json:"resolution"`
	Fps            int         `json:"fps"`
	Vcodec         string      `json:"vcodec"`
	Vbr            interface{} `json:"vbr"`
	StretchedRatio interface{} `json:"stretched_ratio"`
	Acodec         string      `json:"acodec"`
	Abr            int         `json:"abr"`
	Ext            string      `json:"ext"`
	Fulltitle      string      `json:"fulltitle"`
	Filename       string      `json:"_filename"`
}
