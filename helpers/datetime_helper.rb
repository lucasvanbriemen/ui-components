module DatetimeHelper
  def time_ago_in_words(datetime)
    "#{distance_of_time_in_words(datetime, Time.current)} ago"
  end
end
